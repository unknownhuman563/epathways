<?php

namespace App\Services\Immigration;

use App\Services\AIService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Smalot\PdfParser\Parser;

/**
 * Reads INZ's Request-for-Information (RFI) letter and lists the documents /
 * evidence Immigration New Zealand is asking the applicant to provide.
 *
 * This is a DRAFTING AID, not an autonomous agent and not immigration advice
 * (CLAUDE.md AI constraints §1, §6): it extracts only what the letter literally
 * names, and a staff member reviews and edits the list in the RFI modal before
 * anything is created or reaches the client. The AI never becomes the actor who
 * requests documents — the human does, by confirming.
 *
 * Fully defensive: a scanned/image PDF (no embedded text), a disabled or
 * unreachable AI, or a malformed model reply all degrade to an empty list so
 * staff simply type the documents by hand. It never throws into the request.
 */
class RfiDocumentExtractor
{
    /** Cap the number of requests we'll create from one letter. */
    private const MAX_ITEMS = 25;

    public function __construct(private AIService $ai) {}

    /** The PDF parser is present (composer dep). AI readiness is checked per-call. */
    public function supported(): bool
    {
        return class_exists(Parser::class);
    }

    /**
     * Extract the response deadline and requested documents from one or more RFI PDFs.
     *
     * @param  array<int, string>  $absolutePaths
     * @return array{deadline: ?string, documents: array<int, array{label: string, description: string}>, text_found: bool, ai_used: bool}
     */
    public function extract(array $absolutePaths): array
    {
        $text = '';
        foreach ($absolutePaths as $path) {
            $text .= "\n".$this->textFromPdf($path);
        }
        $text = trim($text);

        // A scanned image PDF yields (next to) nothing — signal that so the UI
        // falls back to manual entry rather than showing an empty AI result.
        if (Str::length($text) < 40) {
            return ['deadline' => null, 'documents' => [], 'text_found' => false, 'ai_used' => false];
        }

        if (! $this->ai->isEnabled() || ! $this->ai->configured()) {
            return ['deadline' => null, 'documents' => [], 'text_found' => true, 'ai_used' => false];
        }

        $parsed = $this->extractFromText($text);

        return [
            'deadline' => $parsed['deadline'],
            'documents' => $parsed['documents'],
            'text_found' => true,
            'ai_used' => true,
        ];
    }

    /** Pull the plain text out of a PDF; '' on any failure. */
    public function textFromPdf(string $absolutePath): string
    {
        if (! $this->supported() || ! is_file($absolutePath)) {
            return '';
        }

        $previous = error_reporting();
        error_reporting($previous & ~(E_WARNING | E_NOTICE | E_DEPRECATED));

        try {
            return (string) (new Parser())->parseFile($absolutePath)->getText();
        } catch (\Throwable $e) {
            Log::warning('RfiDocumentExtractor: PDF text extraction failed', ['error' => $e->getMessage()]);

            return '';
        } finally {
            error_reporting($previous);
        }
    }

    /**
     * Ask the model for the response deadline and the documents the letter requests.
     *
     * @return array{deadline: ?string, documents: array<int, array{label: string, description: string}>}
     */
    public function extractFromText(string $text): array
    {
        $system = <<<'PROMPT'
        You read a Request for Information (RFI) or PPI (Potentially Prejudicial Information) letter that Immigration New Zealand (INZ) sent about a visa application. Return the response deadline the letter sets and EACH document or piece of evidence the applicant is being asked to provide, so the applicant can upload one file per item.

        DEADLINE:
        - "deadline" is the date the applicant must respond by, as "YYYY-MM-DD", ONLY if the letter states an absolute calendar date (e.g. "You have until 16-September-2026"). If it gives only a period ("within 14 days") or no date, use null — never calculate or guess it.

        DOCUMENTS — how to split them:
        - Create ONE separate item for EACH distinct document/evidence type the letter names. When several DIFFERENT documents are listed in a single sentence — e.g. "further evidence, which may include employment evidence, records of social insurance payments, income tax records, and bank statements reflecting wage payment" — output a SEPARATE item for EACH one (here: four items), never a single combined item.
        - Also capture evidence requested inside a concern paragraph, e.g. "you have not provided evidence of relevant employment opportunities" → "Evidence of relevant employment opportunities".
        - BUT when the letter lists several ASPECTS, QUESTIONS or points that a SINGLE explanation or statement should address — e.g. "it is unclear how the programme will be applied in practice, how it will support your career goals, or how it represents a benefit compared with your existing qualifications" — that is ONE item (a single statement/explanation the applicant provides), NOT one item per "how…". Combine them into one item and, if useful, summarise the points in its description.
        - Merge only true duplicates (the same document mentioned twice).

        DOCUMENTS — what to exclude:
        - Do NOT invent or add "commonly needed" items that are not in the letter.
        - Do NOT create an item for vague catch-alls such as "any additional documents", "any other information", or "any additional documents to assist us process your application".
        - Do NOT include immigration advice, the response deadline, or instructions on HOW to upload — documents only.

        FIELDS:
        - "label": a short, specific document name (max ~90 chars), e.g. "Employment evidence", "Records of social insurance payments", "Income tax records", "Bank statements reflecting wage payment", "Evidence of relevant employment opportunities".
        - "description": a brief note of what INZ said about that document (max ~200 chars), or "" if the letter adds nothing specific.
        - If the letter requests no documents, use an empty array.

        CRITICAL: Respond with ONLY a valid JSON object. No markdown, no code fences, no preamble.
        Shape: { "deadline": "YYYY-MM-DD" or null, "documents": [ { "label": "…", "description": "…" }, … ] }
        PROMPT;

        // Keep the prompt bounded — RFI letters are short, but guard runaway input.
        $body = Str::limit($text, 12000, '');

        $res = $this->ai->chat([
            ['role' => 'system', 'content' => $system],
            ['role' => 'user', 'content' => "RFI letter text:\n\n".$body],
        ]);

        $parsed = json_decode($this->extractJsonObject((string) ($res['content'] ?? '')), true);
        if (! is_array($parsed)) {
            return ['deadline' => null, 'documents' => []];
        }

        $out = [];
        foreach ((array) ($parsed['documents'] ?? []) as $item) {
            $label = trim((string) (is_array($item) ? ($item['label'] ?? '') : $item));
            if ($label === '') {
                continue;
            }
            $out[] = [
                'label' => Str::limit($label, 118, ''),
                'description' => Str::limit(trim((string) (is_array($item) ? ($item['description'] ?? '') : '')), 490, ''),
            ];
            if (count($out) >= self::MAX_ITEMS) {
                break;
            }
        }

        return [
            'deadline' => $this->normalizeDate($parsed['deadline'] ?? null),
            'documents' => $out,
        ];
    }

    /** Coerce the model's deadline to a sane YYYY-MM-DD, or null. */
    private function normalizeDate($value): ?string
    {
        $raw = trim((string) $value);
        if ($raw === '' || strtolower($raw) === 'null') {
            return null;
        }

        try {
            $date = \Illuminate\Support\Carbon::parse($raw);
        } catch (\Throwable $e) {
            return null;
        }

        // Guard against a model hallucinating an absurd year.
        if ($date->year < 2000 || $date->year > 2100) {
            return null;
        }

        return $date->toDateString();
    }

    /** Pull the first JSON object out of a model response (tolerates fences/prose). */
    private function extractJsonObject(string $content): string
    {
        $trimmed = trim($content);
        if (preg_match('/```(?:json)?\s*(.+?)\s*```/s', $trimmed, $m)) {
            $trimmed = trim($m[1]);
        }
        $start = strpos($trimmed, '{');
        $end = strrpos($trimmed, '}');
        if ($start !== false && $end !== false && $end > $start) {
            return substr($trimmed, $start, $end - $start + 1);
        }

        return $trimmed;
    }
}
