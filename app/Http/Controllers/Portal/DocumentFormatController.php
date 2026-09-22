<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\DocumentFormat;
use App\Models\DocumentFormatCase;
use App\Models\Lead;
use App\Models\LeadDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Staff-built document formats (Word-style rich text) and their per-case use.
 * Actions redirect back to whichever portal page invoked them, so both the
 * immigration and immigration-adviser Client Documents screens share these.
 */
class DocumentFormatController extends Controller
{
    private array $rules = [
        'name' => 'required|string|max:160',
        'content' => 'nullable|string',
        'category' => 'nullable|in:client_facing,internal',
        'status' => 'nullable|in:draft,live',
        'visa_types' => 'nullable|array',
        'visa_types.*' => 'string|max:120',
    ];

    public function store(Request $request)
    {
        $data = $request->validate($this->rules);

        DocumentFormat::create([
            'name' => $data['name'],
            'category' => $data['category'] ?? 'client_facing',
            'content' => $data['content'] ?? null,
            'visa_types' => $data['visa_types'] ?? null,
            'status' => $data['status'] ?? 'draft',
            'created_by' => Auth::id(),
        ]);

        return back()->with('success', 'Document format created.');
    }

    public function update(Request $request, DocumentFormat $format)
    {
        $data = $request->validate($this->rules);
        $format->update([
            'name' => $data['name'],
            'category' => $data['category'] ?? $format->category,
            'content' => $data['content'] ?? null,
            'visa_types' => $data['visa_types'] ?? null,
            'status' => $data['status'] ?? $format->status,
        ]);

        return back()->with('success', 'Document format saved.');
    }

    public function destroy(DocumentFormat $format)
    {
        $format->delete();

        return back()->with('success', 'Document format deleted.');
    }

    /**
     * Apply a format to one or more cases — each gets its own (optionally
     * edited) copy of the content. Re-applying to the same case updates it.
     */
    public function apply(Request $request, DocumentFormat $format)
    {
        $data = $request->validate([
            'lead_ids' => 'required|array|min:1|max:100',
            'lead_ids.*' => 'integer|exists:leads,id',
            'content' => 'nullable|string',
        ]);

        foreach ($data['lead_ids'] as $leadId) {
            DocumentFormatCase::updateOrCreate(
                ['document_format_id' => $format->id, 'lead_id' => $leadId],
                ['content' => $data['content'] ?? $format->content, 'created_by' => Auth::id()],
            );
        }

        $n = count($data['lead_ids']);

        return back()->with('success', "“{$format->name}” applied to {$n} case".($n === 1 ? '' : 's').'.');
    }

    public function removeUse(DocumentFormatCase $use)
    {
        $use->delete();

        return back()->with('success', 'Removed from the case.');
    }

    /**
     * Send a written document to a client: fill the {variables} with the chosen
     * case's real values, render a PDF, attach it to the case and mark it shared
     * so it surfaces on the client's portal / tracking link. The same document
     * can also be saved as a reusable format (Save) — this is the one-off send.
     */
    public function sendToCase(Request $request)
    {
        $data = $request->validate([
            'lead_id' => 'required|integer|exists:leads,id',
            'name' => 'required|string|max:160',
            'content' => 'required|string',
        ]);

        $lead = Lead::findOrFail($data['lead_id']);
        $filled = $this->fillVariables($data['content'], $lead);
        $title = trim($data['name']) ?: 'Client document';

        try {
            $binary = \Barryvdh\DomPDF\Facade\Pdf::loadView('documents.format', [
                'title' => $title,
                'content' => $filled,
            ])->setPaper('a4')->setOption('isHtml5ParserEnabled', true)->output();

            $safeName = preg_replace('/[^A-Za-z0-9]+/', '-', $title) ?: 'Client-document';
            $filename = "{$safeName}.pdf";
            $path = "lead-documents/{$lead->id}/".Str::random(12)."-{$filename}";
            Storage::disk('local')->put($path, $binary);

            LeadDocument::create([
                'lead_id' => $lead->id,
                'request_id' => null,
                'checklist_key' => null,
                'original_name' => $filename,
                'file_path' => $path,
                'mime' => 'application/pdf',
                'size' => strlen($binary),
                'status' => LeadDocument::STATUS_STAFF_SHARED,
                'source' => LeadDocument::SOURCE_GENERATED,
                'source_variant' => 'client_document',
                'uploaded_by' => Auth::id(),
                'reviewed_by' => Auth::id(),
                'reviewed_at' => now(),
            ]);

            $lead->recordStaffActivity('Sent to client: '.$title);

            $name = trim("{$lead->first_name} {$lead->last_name}") ?: ($lead->lead_id ?? 'the client');

            return back()->with('success', "“{$title}” sent to {$name}.");
        } catch (\Throwable $e) {
            Log::error('Client document send failed', ['lead_id' => $lead->id, 'error' => $e->getMessage()]);

            return back()->withErrors(['error' => 'Could not send the document: '.$e->getMessage()]);
        }
    }

    /**
     * Download the document the staff member is writing as a PDF or a Word (.doc)
     * file. Optionally fills the {variables} from a case first; without one, the
     * raw document (tokens intact) is downloaded — the reusable format itself.
     */
    public function download(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:160',
            'content' => 'required|string',
            'format' => 'required|in:pdf,word',
            'lead_id' => 'nullable|integer|exists:leads,id',
        ]);

        $title = trim($data['name']) ?: 'Client document';
        $html = $data['content'];
        if (! empty($data['lead_id']) && ($lead = Lead::find($data['lead_id']))) {
            $html = $this->fillVariables($html, $lead);
        }

        $safe = preg_replace('/[^A-Za-z0-9]+/', '-', $title) ?: 'Client-document';

        if ($data['format'] === 'pdf') {
            return \Barryvdh\DomPDF\Facade\Pdf::loadView('documents.format', ['title' => $title, 'content' => $html])
                ->setPaper('a4')->setOption('isHtml5ParserEnabled', true)
                ->download("{$safe}.pdf");
        }

        // Word: an HTML document Word opens natively (no PhpWord dependency).
        $wordHtml = view('documents.word', ['title' => $title, 'content' => $html])->render();

        return response($wordHtml, 200, [
            'Content-Type' => 'application/vnd.ms-word',
            'Content-Disposition' => 'attachment; filename="'.$safe.'.doc"',
        ]);
    }

    /**
     * Replace {token} merge fields with the case's real values. Unknown tokens
     * are left untouched (never fabricated) — matching the on-screen preview —
     * so staff spot an unfilled field before it goes out. Fees/dates that have
     * no single reliable source are intentionally not auto-filled here.
     */
    private function fillVariables(string $html, Lead $lead): string
    {
        $user = Auth::user();
        $map = [
            'client.full_name' => trim("{$lead->first_name} {$lead->last_name}"),
            'client.first_name' => $lead->first_name,
            'client.email' => $lead->email,
            'client.nationality' => $lead->citizenship ?: $lead->residence_country,
            'client.passport_no' => $lead->passport_number,
            'case.reference' => $lead->lead_id,
            'case.visa_type' => $lead->inz_visa_type,
            'adviser.full_name' => $user?->name,
            'adviser.licence' => $user?->iaa_licence_number,
            'firm.name' => config('app.name', 'ePathways Limited'),
            'firm.address' => config('services.contact.address'),
            'today' => now()->format('d M Y'),
        ];

        return preg_replace_callback('/\{([a-z0-9_.]+)\}/i', function ($m) use ($map) {
            $key = $m[1];

            // Only substitute keys we can resolve to a non-empty value; leave
            // everything else as the literal {token}.
            return array_key_exists($key, $map) && $map[$key] !== null && $map[$key] !== ''
                ? e($map[$key])
                : $m[0];
        }, $html);
    }
}
