<?php

namespace App\Services\Immigration;

use App\Models\LeadDocument;
use App\Services\AIService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * "Document vs client record" — sends a referred document to the AI (multimodal
 * Gemini via OpenRouter), extracts identity fields, and compares each against
 * the case file. INDICATIVE ONLY: it never gives immigration advice; the LIA
 * makes the call. Extracted values come straight from the model reading the
 * document — an absent field is reported as unknown, never guessed.
 */
class VerificationScanService
{
    /** Passport expiry inside this window is flagged for the adviser's attention. */
    private const EXPIRY_BUFFER_DAYS = 90;

    public function __construct(protected AIService $ai) {}

    /**
     * @return array{ok: bool, error?: string, rows?: array, conflicts?: int, scanned_at?: string}
     */
    public function scan(LeadDocument $document): array
    {
        if (! $this->ai->isEnabled() || ! $this->ai->configured()) {
            return ['ok' => false, 'error' => 'AI scanning is currently turned off.'];
        }

        $lead = $document->lead;
        if (! $lead) {
            return ['ok' => false, 'error' => 'This document is not linked to a case.'];
        }

        $content = $this->documentContentPart($document);
        if ($content === null) {
            return ['ok' => false, 'error' => 'The document file could not be read for scanning.'];
        }

        $prompt = 'You are extracting identity fields from an uploaded immigration document (passport, '
            .'certificate, or letter). Read the document and return ONLY a JSON object with these keys: '
            .'"full_name" (as printed, surname first if shown that way), "date_of_birth" (YYYY-MM-DD), '
            .'"passport_number", "passport_expiry" (YYYY-MM-DD), "nationality". Use null for any field '
            .'that is not clearly present in the document. Do not guess. Return only the JSON object.';

        $messages = [[
            'role' => 'user',
            'content' => [
                ['type' => 'text', 'text' => $prompt],
                $content,
            ],
        ]];

        $result = $this->ai->chat($messages);
        $extracted = $this->parseJson($result['content'] ?? null);

        if ($extracted === null) {
            Log::info('VerificationScan: model returned no parseable JSON', ['doc' => $document->id]);

            return ['ok' => false, 'error' => 'The AI could not read structured details from this document.'];
        }

        $rows = $this->compare($lead, $extracted);

        return [
            'ok' => true,
            'rows' => $rows,
            'conflicts' => count(array_filter($rows, fn ($r) => $r['verdict'] === 'conflict')),
            'scanned_at' => now()->toIso8601String(),
        ];
    }

    /** Build the OpenRouter multimodal content part for the document. */
    private function documentContentPart(LeadDocument $document): ?array
    {
        $bytes = $this->fileBytes($document);
        if ($bytes === null) {
            return null;
        }

        $mime = $document->mime ?: 'application/octet-stream';
        $b64 = base64_encode($bytes);

        if (str_starts_with($mime, 'image/')) {
            return ['type' => 'image_url', 'image_url' => ['url' => "data:{$mime};base64,{$b64}"]];
        }

        // PDFs (and anything else) go through OpenRouter's file input, which
        // Gemini reads natively.
        return ['type' => 'file', 'file' => [
            'filename' => $document->original_name ?: 'document.pdf',
            'file_data' => "data:{$mime};base64,{$b64}",
        ]];
    }

    private function fileBytes(LeadDocument $document): ?string
    {
        if (! $document->file_path) {
            return null;
        }
        foreach (['local', 'public'] as $disk) {
            if (Storage::disk($disk)->exists($document->file_path)) {
                return Storage::disk($disk)->get($document->file_path);
            }
        }

        return null;
    }

    /** Pull the first JSON object out of the model's reply (it may add prose). */
    private function parseJson(?string $raw): ?array
    {
        if (! $raw) {
            return null;
        }
        $raw = trim($raw);
        if (str_starts_with($raw, '```')) {
            $raw = preg_replace('/^```(?:json)?|```$/m', '', $raw);
        }
        $start = strpos($raw, '{');
        $end = strrpos($raw, '}');
        if ($start === false || $end === false || $end <= $start) {
            return null;
        }
        $json = substr($raw, $start, $end - $start + 1);
        $data = json_decode($json, true);

        return is_array($data) ? $data : null;
    }

    /** Compare each extracted value to the case file. */
    private function compare($lead, array $ex): array
    {
        $recordName = trim("{$lead->first_name} {$lead->middle_name} {$lead->last_name}");
        $recordDob = $lead->dob ? $lead->dob->format('Y-m-d') : null;
        $recordPassport = $lead->passport_number ?: null;
        $recordExpiry = $lead->passport_expiry ? $lead->passport_expiry->format('Y-m-d') : null;

        $rows = [];

        $rows[] = $this->nameRow('Full name', $ex['full_name'] ?? null, $recordName);
        $rows[] = $this->exactRow('Date of birth', $ex['date_of_birth'] ?? null, $recordDob);
        $rows[] = $this->exactRow('Passport number', $ex['passport_number'] ?? null, $recordPassport, true);
        $rows[] = $this->expiryRow('Expiry', $ex['passport_expiry'] ?? null, $recordExpiry);

        return $rows;
    }

    private function nameRow(string $label, ?string $value, ?string $record): array
    {
        if (! $value) {
            return $this->row($label, null, 'review', 'Not found in the document');
        }
        if (! $record) {
            return $this->row($label, $value, 'review', 'No name on file to compare');
        }
        $norm = fn ($s) => collect(preg_split('/\s+/', strtoupper(preg_replace('/[^a-z\s]/i', ' ', $s))))
            ->filter()->sort()->values()->implode(' ');
        $verdict = $norm($value) === $norm($record) ? 'match' : 'conflict';

        return $this->row($label, $value, $verdict, $verdict === 'match' ? 'Matches case file' : "File has {$record}");
    }

    private function exactRow(string $label, ?string $value, ?string $record, bool $strip = false): array
    {
        if (! $value) {
            return $this->row($label, null, 'review', 'Not found in the document');
        }
        if (! $record) {
            return $this->row($label, $value, 'review', 'No value on file to compare');
        }
        $norm = fn ($s) => $strip ? strtoupper(preg_replace('/\s+/', '', $s)) : trim($s);
        $verdict = $norm($value) === $norm($record) ? 'match' : 'conflict';

        return $this->row($label, $value, $verdict, $verdict === 'match' ? 'Matches case file' : "File has {$record}");
    }

    private function expiryRow(string $label, ?string $value, ?string $record): array
    {
        if (! $value) {
            return $this->row($label, null, 'review', 'Not found in the document');
        }
        try {
            $days = (int) Carbon::now()->diffInDays(Carbon::parse($value), false);
        } catch (\Throwable $e) {
            return $this->row($label, $value, 'review', 'Could not read the expiry date');
        }

        if ($record && $value !== $record) {
            return $this->row($label, $value, 'conflict', "File has {$record}");
        }
        if ($days < 0) {
            return $this->row($label, $value, 'conflict', 'Passport has expired');
        }
        if ($days <= self::EXPIRY_BUFFER_DAYS) {
            return $this->row($label, $value, 'review', "{$days} days out — under 3-month buffer");
        }

        return $this->row($label, $value, 'match', 'Valid, outside the buffer');
    }

    private function row(string $label, ?string $value, string $verdict, string $note): array
    {
        return ['label' => $label, 'value' => $value, 'verdict' => $verdict, 'note' => $note];
    }
}
