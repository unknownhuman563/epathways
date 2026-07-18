<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\LeadDocumentRequest;
use App\Services\AgreementGenerator;
use App\Services\Immigration\CaseChecklistService;
use App\Services\Immigration\EngagementDocumentGenerator;
use App\Support\UploadValidation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Document workflow shared by staff (admin/sales) and the lead's own portal.
 *
 *   staffIndex()    — staff view of one lead's documents
 *   requestStore()  — staff requests one or more documents from the lead
 *   updateStatus()  — staff approves / rejects a submitted document
 *   destroyRequest() — staff cancels an open request
 *   shareWithLead() — staff uploads a file FOR the lead to download
 *
 *   leadIndex()     — lead's own view of their requested + uploaded docs
 *   leadUpload()    — lead uploads a file (against a request or unsolicited)
 *
 *   download()      — single endpoint, role-gated. Lead can download files
 *                     against their own lead_id. Staff can download any.
 *
 * Files live in storage/app/private/lead-documents/<lead_id>/ and are never
 * exposed via a public URL — every download goes through download().
 */
class LeadDocumentController extends Controller
{
    private const DISK = 'local'; // private; downloads streamed via controller

    /**
     * Store an uploaded checklist file, renaming it to the visa checklist's
     * "NN - CODE - FirstnameLASTNAME<suffix>" convention when the matched
     * checklist item defines a file_code. Falls back to the original filename
     * for items (or visa types) without a naming convention.
     *
     * @return array{0: string, 1: string} [storedPath, displayName]
     */
    private function storeChecklistFile($file, Lead $lead, string $key): array
    {
        $dir = "lead-documents/{$lead->id}";
        $desired = app(CaseChecklistService::class)
            ->uploadFileNameFor($lead, $key, $file->getClientOriginalName());

        if (! $desired) {
            return [$file->store($dir, self::DISK), $file->getClientOriginalName()];
        }

        $filename = $this->uniqueFilename($dir, $desired);

        return [$file->storeAs($dir, $filename, self::DISK), $filename];
    }

    /**
     * Ensure a filename doesn't clobber an existing file in the same folder,
     * appending " (2)", " (3)", … before the extension until it's unique.
     */
    private function uniqueFilename(string $dir, string $filename): string
    {
        $disk = Storage::disk(self::DISK);
        if (! $disk->exists("{$dir}/{$filename}")) {
            return $filename;
        }

        $ext = pathinfo($filename, PATHINFO_EXTENSION);
        $base = $ext !== '' ? substr($filename, 0, -(strlen($ext) + 1)) : $filename;

        $i = 2;
        do {
            $candidate = $ext !== '' ? "{$base} ({$i}).{$ext}" : "{$base} ({$i})";
            $i++;
        } while ($disk->exists("{$dir}/{$candidate}"));

        return $candidate;
    }

    // ── STAFF (admin / sales) ───────────────────────────────────────────────

    public function staffIndex(Request $request, $leadId)
    {
        $lead = Lead::findOrFail($leadId);

        $requests = $lead->loadMissing(['documentRequests.requester:id,name', 'documentRequests.latestDocument'])
            ->documentRequests()
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (LeadDocumentRequest $r) => [
                'id' => $r->id,
                'label' => $r->label,
                'description' => $r->description,
                'required' => $r->required,
                'requested_by' => optional($r->requester)->name,
                'requested_at' => $r->requested_at,
                'latest_document' => $r->latestDocument ? $this->docSerialize($r->latestDocument) : null,
            ]);

        // Documents not tied to any request (unsolicited or staff-shared)
        $orphans = LeadDocument::where('lead_id', $lead->id)
            ->whereNull('request_id')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (LeadDocument $d) => $this->docSerialize($d));

        return inertia('admin/LeadDocuments', [
            'lead' => [
                'id' => $lead->id,
                'lead_id' => $lead->lead_id,
                'name' => trim("{$lead->first_name} {$lead->last_name}"),
                'email' => $lead->email,
                'status' => $lead->status,
                'stage' => $lead->stage,
                'source' => $lead->source,
                'portal_invitation_status' => $lead->portal_invitation_status,
            ],
            'requests' => $requests,
            'orphans' => $orphans,
            'templates' => $this->requestTemplates(),
        ]);
    }

    public function requestStore(Request $request, $leadId)
    {
        $lead = Lead::findOrFail($leadId);

        $data = $request->validate([
            'items' => 'required|array|min:1|max:20',
            'items.*.label' => 'required|string|max:120',
            'items.*.description' => 'nullable|string|max:500',
            'items.*.required' => 'sometimes|boolean',
        ]);

        try {
            foreach ($data['items'] as $item) {
                $docRequest = LeadDocumentRequest::create([
                    'lead_id' => $lead->id,
                    'label' => $item['label'],
                    'description' => $item['description'] ?? null,
                    'required' => $item['required'] ?? true,
                    'requested_by' => Auth::id(),
                    'requested_at' => now(),
                ]);

                // Email/SMS the lead a link to upload it. Prefer the
                // 'doc_request' template; fall back to the legacy Mailable.
                if (! empty($lead->email)) {
                    try {
                        $res = app(\App\Services\CommunicationService::class)
                            ->sendTemplated('doc_request', $lead, ['document_name' => $docRequest->label]);
                        if (! $res['email']) {
                            Mail::to($lead->email)->send(new \App\Mail\DocumentRequestedFromLead($lead, $docRequest));
                        }
                    } catch (\Throwable $e) {
                        Log::error('DocumentRequestedFromLead dispatch failed', ['lead_id' => $lead->id, 'error' => $e->getMessage()]);
                    }
                }
            }

            return back()->with('success', count($data['items']).' document request(s) added.');
        } catch (\Throwable $e) {
            Log::error('Document request create failed', ['lead_id' => $leadId, 'error' => $e->getMessage()]);

            return back()->withErrors(['error' => 'Could not save requests.']);
        }
    }

    public function destroyRequest(Request $request, $leadId, $requestId)
    {
        $r = LeadDocumentRequest::where('lead_id', $leadId)->findOrFail($requestId);
        // Don't delete the underlying uploads — just decouple them
        $r->documents()->update(['request_id' => null]);
        $r->delete();

        return back()->with('success', 'Request removed.');
    }

    public function updateStatus(Request $request, $leadId, $docId)
    {
        $doc = LeadDocument::where('lead_id', $leadId)->findOrFail($docId);

        $validated = $request->validate([
            'status' => ['required', Rule::in([
                LeadDocument::STATUS_SUBMITTED,
                LeadDocument::STATUS_UNDER_REVIEW,
                LeadDocument::STATUS_APPROVED,
                LeadDocument::STATUS_REJECTED,
            ])],
            'note' => 'nullable|string|max:500',
        ]);

        $doc->update([
            'status' => $validated['status'],
            'note' => $validated['note'] ?? $doc->note,
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
        ]);

        // Tell the lead their document was approved / rejected. Prefer the
        // doc_approved / doc_rejected templates; fall back to the Mailable.
        $lead = $doc->lead;
        if (in_array($validated['status'], [LeadDocument::STATUS_APPROVED, LeadDocument::STATUS_REJECTED], true)
            && $lead && ! empty($lead->email)) {
            try {
                $key = $validated['status'] === LeadDocument::STATUS_APPROVED ? 'doc_approved' : 'doc_rejected';
                $res = app(\App\Services\CommunicationService::class)->sendTemplated($key, $lead, [
                    'document_name' => $doc->original_name,
                    'reason' => $validated['note'] ?? '',
                ]);
                if (! $res['email']) {
                    Mail::to($lead->email)->send(new \App\Mail\DocumentStatusChanged($lead, $doc->fresh(), $validated['note'] ?? null));
                }
            } catch (\Throwable $e) {
                Log::error('DocumentStatusChanged dispatch failed', ['doc_id' => $doc->id, 'error' => $e->getMessage()]);
            }
        }

        return back()->with('success', "Document marked {$validated['status']}.");
    }

    public function shareWithLead(Request $request, $leadId)
    {
        $lead = Lead::findOrFail($leadId);
        $request->validate([
            'file' => 'required|'.UploadValidation::document(),
            'note' => 'nullable|string|max:500',
        ]);

        $path = $request->file('file')->store("lead-documents/{$lead->id}", self::DISK);

        LeadDocument::create([
            'lead_id' => $lead->id,
            'request_id' => null,
            'original_name' => $request->file('file')->getClientOriginalName(),
            'file_path' => $path,
            'mime' => $request->file('file')->getMimeType(),
            'size' => $request->file('file')->getSize(),
            'status' => LeadDocument::STATUS_STAFF_SHARED,
            'note' => $request->input('note'),
            'uploaded_by' => Auth::id(),
        ]);

        return back()->with('success', 'File shared with the lead.');
    }

    /**
     * Staff uploads a file (or files) for the lead against a specific
     * checklist item — used by the agreements panel, or when staff helps
     * the lead by uploading on their behalf.
     */
    public function staffChecklistUpload(Request $request, $leadId, $key)
    {
        $lead = Lead::findOrFail($leadId);

        $request->validate([
            'files' => 'required|array|min:1|max:10',
            'files.*' => UploadValidation::document(),
        ]);

        try {
            foreach ($request->file('files') as $file) {
                [$path, $displayName] = $this->storeChecklistFile($file, $lead, $key);

                LeadDocument::create([
                    'lead_id' => $lead->id,
                    'request_id' => null,
                    'checklist_key' => $key,
                    'original_name' => $displayName,
                    'file_path' => $path,
                    'mime' => $file->getMimeType(),
                    'size' => $file->getSize(),
                    'status' => LeadDocument::STATUS_SUBMITTED,
                    'uploaded_by' => Auth::id(),
                ]);
            }

            $n = count($request->file('files'));

            return back()->with('success', "{$n} ".($n === 1 ? 'file' : 'files').' uploaded.');
        } catch (\Throwable $e) {
            Log::error('Staff checklist upload failed', ['lead_id' => $leadId, 'key' => $key, 'error' => $e->getMessage()]);

            return back()->withErrors(['error' => 'Could not upload that file.']);
        }
    }

    /**
     * Generate a templated agreement (Blade -> PDF) and attach it to the
     * lead's documents under the matching checklist key. Routes by key:
     *   agree.consultancy        — Consultancy Agreement (Single | Partner)
     *   agree.engagement_english — English Engagement Agreement (no variant)
     */
    public function generateAgreement(Request $request, AgreementGenerator $generator, $leadId, $key)
    {
        $lead = Lead::findOrFail($leadId);

        $data = $request->validate([
            // 'variant' only meaningful for consultancy. Optional so the
            // engagement-english call doesn't need to include it.
            'variant' => 'nullable|in:single,partner',
        ]);

        try {
            if ($key === 'agree.consultancy') {
                $variant = $data['variant'] ?? 'single';
                $generator->consultancy($lead, $variant);

                return back()->with('success', "Consultancy Agreement generated ({$variant}).");
            }

            if ($key === 'agree.engagement_english') {
                $generator->englishEngagement($lead);

                return back()->with('success', 'English Engagement Agreement generated.');
            }

            return back()->withErrors(['error' => 'This checklist item does not support auto-generation.']);
        } catch (\Throwable $e) {
            Log::error('Agreement generation failed', [
                'lead_id' => $leadId,
                'key' => $key,
                'variant' => $data['variant'] ?? null,
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors(['error' => 'Could not generate the agreement: '.$e->getMessage()]);
        }
    }

    /**
     * Unified generate endpoint for the "Proposal & Agreements" page.
     * Types:
     *   consultancy_std_150      → Scenario #1 STANDARD 150,000
     *   consultancy_voucher_150  → Scenario #2 WITH VOUCHER 150,000
     *   consultancy_std_100      → Scenario #3 STANDARD 100,000
     *   consultancy_english_100  → Scenario #3 WITH ENGLISH 100,000
     *   english_engagement       → English Engagement Agreement
     *
     * Optional POST body: school_enrolment_fee, english_proficiency_fee
     * — override the two editable amounts on the modal Settings panel.
     */
    public function generateDocument(Request $request, AgreementGenerator $generator, $leadId, $type)
    {
        $lead = Lead::findOrFail($leadId);

        try {
            // Immigration engagement docs (written agreement + IAA standards)
            // are backed by their own generator/templates.
            $engageType = $this->engagementTypeFor($type);
            if ($engageType !== null) {
                app(EngagementDocumentGenerator::class)->generate($lead, $engageType);
                $label = EngagementDocumentGenerator::DOCS[$engageType]['label'];

                return back()->with('success', "{$label} generated for {$lead->first_name} {$lead->last_name}.");
            }

            $consultancyScenario = $this->consultancyScenarioForType($type);
            $overrides = $this->feeOverridesFromRequest($request);

            if ($consultancyScenario !== null) {
                $generator->consultancy($lead, $consultancyScenario, $overrides);
                $friendly = 'Consultancy Agreement';
            } elseif ($type === 'english_engagement') {
                $generator->englishEngagement($lead);
                $friendly = 'English Engagement';
            } else {
                return back()->withErrors(['error' => "Unknown document type: {$type}"]);
            }

            return back()->with('success', "{$friendly} generated for {$lead->first_name} {$lead->last_name}.");
        } catch (\Throwable $e) {
            Log::error('Unified document generation failed', [
                'lead_id' => $leadId,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors(['error' => 'Could not generate the document: '.$e->getMessage()]);
        }
    }

    /**
     * Generate one or more immigration engagement documents at once —
     * driven by the "New" flow on the Engagement workspace. Each selected
     * type is rendered to a PDF and stored against the case.
     */
    public function generateEngagement(Request $request, EngagementDocumentGenerator $generator, $leadId)
    {
        $lead = Lead::findOrFail($leadId);

        $data = $request->validate([
            'types' => 'required|array|min:1',
            'types.*' => ['string', Rule::in(array_keys(EngagementDocumentGenerator::DOCS))],
            'notify' => 'sometimes|boolean',
            'signer_id' => 'nullable|integer|exists:users,id',
        ]);

        $overrides = ! empty($data['signer_id']) ? ['signer_id' => $data['signer_id']] : [];

        try {
            // Keep the created document id per type so the notification can
            // deep-link each icon straight to its generated PDF.
            $generatedDocIds = [];
            foreach ($data['types'] as $t) {
                $doc = $generator->generate($lead, $t, $overrides);
                $generatedDocIds[$t] = $doc->id;
            }

            $n = count($data['types']);
            $message = "{$n} engagement document(s) generated for {$lead->first_name} {$lead->last_name}.";

            // Optionally email the client that their documents are now
            // available on their application tracker.
            if (! empty($data['notify'])) {
                if (empty($lead->email)) {
                    $message .= ' Email not sent — no email on file.';
                } elseif (empty($lead->tracking_code)) {
                    $message .= ' Email not sent — no tracking code on file.';
                } else {
                    Mail::to($lead->email)->send(new \App\Mail\EngagementDocumentsReady($lead, $data['types'], $generatedDocIds));
                    $message .= " Client notified at {$lead->email}.";
                }
            }

            return back()->with('success', $message);
        } catch (\Throwable $e) {
            Log::error('Engagement bulk generation failed', ['lead_id' => $leadId, 'error' => $e->getMessage()]);

            return back()->withErrors(['error' => 'Could not generate the documents: '.$e->getMessage()]);
        }
    }

    /**
     * Resolve a URL `type` of the form `engage_<key>` to its engagement
     * document key, or null when it isn't an engagement document.
     */
    private function engagementTypeFor(string $type): ?string
    {
        if (! str_starts_with($type, 'engage_')) {
            return null;
        }

        $key = substr($type, strlen('engage_'));

        return array_key_exists($key, EngagementDocumentGenerator::DOCS) ? $key : null;
    }

    /** Map a URL type to its consultancy scenario key, or null if not a consultancy. */
    private function consultancyScenarioForType(string $type): ?string
    {
        return match ($type) {
            'consultancy_std_150' => 'std_150',
            'consultancy_voucher_150' => 'voucher_150',
            'consultancy_std_100' => 'std_100',
            'consultancy_english_100' => 'english_100',
            default => null,
        };
    }

    /**
     * Pull school_enrolment_fee + english_proficiency_fee out of the
     * request (query string on GET preview, form body on POST generate)
     * and coerce them to positive integers. Missing keys stay unset so
     * the generator falls back to defaults.
     */
    private function feeOverridesFromRequest(Request $request): array
    {
        $out = [];
        foreach (['school_enrolment_fee', 'english_proficiency_fee'] as $key) {
            $val = $request->input($key);
            if ($val !== null && $val !== '' && is_numeric($val) && (int) $val > 0) {
                $out[$key] = (int) $val;
            }
        }
        // Single vs Couple pick — only honoured by the generator for
        // scenarios that support both. Anything else is coerced back
        // to 'single' server-side.
        $mode = $request->input('applicant_mode');
        if (in_array($mode, ['single', 'couple'], true)) {
            $out['applicant_mode'] = $mode;
        }

        return $out;
    }

    /**
     * Render the same Blade template that generateDocument() will run
     * through dompdf, but return it as raw HTML for iframe preview. Lets
     * the "New" modal on the Proposal & Agreements page show a live
     * preview that updates as staff pick lead + type — dompdf is way
     * too slow to spin up on every keystroke.
     */
    public function previewDocument(Request $request, AgreementGenerator $generator, $leadId, $type)
    {
        $lead = Lead::findOrFail($leadId);

        // Immigration engagement docs render through their own generator.
        $engageType = $this->engagementTypeFor($type);
        if ($engageType !== null) {
            $signer = $request->query('signer');
            $html = app(EngagementDocumentGenerator::class)
                ->renderHtml($lead, $engageType, $signer ? ['signer_id' => (int) $signer] : []);

            return response($html)->header('Content-Type', 'text/html; charset=utf-8');
        }

        $overrides = $this->feeOverridesFromRequest($request);
        $consultancyScenario = $this->consultancyScenarioForType($type);

        if ($consultancyScenario !== null) {
            [$payload] = $generator->buildConsultancyPayload($lead, $consultancyScenario, $overrides);
            $view = 'agreements.consultancy';
        } elseif ($type === 'english_engagement') {
            $view = 'agreements.engagement-english';
            $payload = $this->englishEngagementPayload($lead);
        } else {
            return response('<html><body style="font-family:sans-serif;padding:2rem;color:#666">Unknown document type.</body></html>', 400)
                ->header('Content-Type', 'text/html; charset=utf-8');
        }

        return response(view($view, $payload)->render())
            ->header('Content-Type', 'text/html; charset=utf-8');
    }

    private function englishEngagementPayload(Lead $lead): array
    {
        $clientName = trim("{$lead->first_name} {$lead->last_name}");

        return [
            'client_name' => $clientName,
            'client_reference' => \Illuminate\Support\Str::slug($clientName ?: 'ClientName', '') ?: 'ClientName',
            'generated_at' => now(),
            'generated_at_formatted' => now()->format('jS').' day of '.now()->format('F Y'),
        ];
    }

    /**
     * Save the staff-proposed program shortlist for a lead. Not a document —
     * this is what the "Proposal" tab on the Proposal & Agreements page
     * builds up: up to 3 program IDs stored on `leads.proposed_program_ids`
     * so the tracker can render them for the lead to choose from.
     *
     * An empty array clears the proposal.
     */
    public function saveProposal(Request $request, $leadId)
    {
        $validated = $request->validate([
            'program_ids' => 'nullable|array|max:3',
            'program_ids.*' => 'integer|exists:programs,id',
        ]);

        try {
            $lead = Lead::findOrFail($leadId);
            // Uniquify + reindex so the JSON stays clean regardless of
            // client-side ordering / duplicates.
            $ids = array_values(array_unique(array_map('intval', $validated['program_ids'] ?? [])));
            $lead->proposed_program_ids = $ids ?: null;
            $lead->save();

            $count = count($ids);
            $msg = $count === 0
                ? "Proposal cleared for {$lead->first_name} {$lead->last_name}."
                : "Proposed {$count} program".($count === 1 ? '' : 's')." for {$lead->first_name} {$lead->last_name}.";

            return back()->with('success', $msg);
        } catch (\Throwable $e) {
            Log::error('Save proposal failed', ['lead_id' => $leadId, 'error' => $e->getMessage()]);

            return back()->withErrors(['error' => 'Could not save the proposal: '.$e->getMessage()]);
        }
    }

    /**
     * "Your document is ready" nudge — sends the lead the queued
     * DocumentReadyNotification pointing at their /track/{code} page.
     * Called from the Notify button on the Proposal & Agreements table
     * after staff has generated a document.
     */
    public function notifyDocumentReady(Request $request, $leadId)
    {
        $validated = $request->validate([
            'kind' => 'nullable|string|in:proposal,agreement',
        ]);

        try {
            $lead = Lead::findOrFail($leadId);

            if (empty($lead->email)) {
                return back()->withErrors(['error' => "{$lead->first_name} {$lead->last_name} has no email on file — cannot notify."]);
            }
            if (empty($lead->tracking_code)) {
                return back()->withErrors(['error' => 'Lead has no tracking code — cannot build the tracker URL.']);
            }

            $kind = $validated['kind'] ?? 'agreement';

            // The "proposal" notify sends the branded Study Proposal template
            // (editable under Email → Templates) with the lead's up-to-3
            // suggested programs filled in. Falls back to the plain Mailable
            // if the template is missing/inactive or has no email channel.
            if ($kind === 'proposal') {
                $res = app(\App\Services\CommunicationService::class)
                    ->sendTemplated('program_proposal', $lead, $this->proposalProgramVars($lead));
                if (! $res['email']) {
                    Mail::to($lead->email)->send(new \App\Mail\DocumentReadyNotification($lead, 'proposal'));
                }
            } else {
                Mail::to($lead->email)->send(new \App\Mail\DocumentReadyNotification($lead, $kind));
            }

            return back()->with('success', "Notification sent to {$lead->first_name} {$lead->last_name}.");
        } catch (\Throwable $e) {
            Log::error('Document-ready notification failed', ['lead_id' => $leadId, 'error' => $e->getMessage()]);

            return back()->withErrors(['error' => 'Could not send the notification: '.$e->getMessage()]);
        }
    }

    /**
     * Build the {{program_1}}..{{program_3}} context for the Study Proposal
     * template from the lead's proposed_program_ids. Each is a plain-text
     * "Title — Level · Fee" line; missing slots are empty strings so the
     * template's fixed three Option lines still render cleanly.
     */
    private function proposalProgramVars(Lead $lead): array
    {
        $ids = is_array($lead->proposed_program_ids) ? $lead->proposed_program_ids : [];

        $lines = \App\Models\Program::whereIn('id', $ids)
            ->get(['id', 'title', 'level', 'price_text'])
            ->keyBy('id');

        $vars = ['program_1' => '', 'program_2' => '', 'program_3' => ''];

        $slot = 1;
        foreach ($ids as $pid) {
            if ($slot > 3) {
                break;
            }
            $p = $lines->get($pid);
            if (! $p) {
                continue;
            }

            $parts = array_filter([
                $p->title,
                $p->level ? "Level {$p->level}" : null,
                $p->price_text ?: null,
            ]);
            $vars['program_'.$slot] = implode(' · ', $parts);
            $slot++;
        }

        return $vars;
    }

    /**
     * Delete a single uploaded file. Removes the storage object too so the
     * lead's private folder doesn't bloat with orphan files.
     */
    public function destroyDocument(Request $request, $leadId, $docId)
    {
        $doc = LeadDocument::where('lead_id', $leadId)->findOrFail($docId);
        try {
            Storage::disk(self::DISK)->exists($doc->file_path)
                ? Storage::disk(self::DISK)->delete($doc->file_path)
                : null;
            $doc->delete();

            return back()->with('success', 'File removed.');
        } catch (\Throwable $e) {
            Log::error('Document delete failed', ['doc_id' => $docId, 'error' => $e->getMessage()]);

            return back()->withErrors(['error' => 'Could not delete that file.']);
        }
    }

    /**
     * Lead acknowledges they've read and agreed to the Consultancy +
     * English Engagement Agreement terms. Sets / clears a single
     * timestamp on the lead so staff can see when it happened.
     */
    public function leadAcknowledgeAgreements(Request $request)
    {
        $user = Auth::user();
        $lead = $user?->lead;
        abort_unless($lead, 403);

        $data = $request->validate([
            'acknowledged' => 'required|boolean',
        ]);

        $lead->update([
            'agreements_acknowledged_at' => $data['acknowledged'] ? now() : null,
        ]);

        return back()->with('success', $data['acknowledged']
            ? 'Agreements acknowledged.'
            : 'Acknowledgment cleared.');
    }

    // ── LEAD (own portal) ───────────────────────────────────────────────────

    public function leadIndex()
    {
        $user = Auth::user();
        $lead = $user?->lead;
        abort_unless($lead, 403);

        $requests = $lead->documentRequests()
            ->with('latestDocument')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (LeadDocumentRequest $r) => [
                'id' => $r->id,
                'label' => $r->label,
                'description' => $r->description,
                'required' => $r->required,
                'requested_at' => $r->requested_at,
                'latest_document' => $r->latestDocument ? $this->docSerialize($r->latestDocument) : null,
            ]);

        $sharedByStaff = LeadDocument::where('lead_id', $lead->id)
            ->where('status', LeadDocument::STATUS_STAFF_SHARED)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (LeadDocument $d) => $this->docSerialize($d));

        // Files uploaded against Documents-tab checklist items, grouped by
        // the item's frontend key so the gated section flow can render them.
        $checklistFiles = LeadDocument::where('lead_id', $lead->id)
            ->whereNotNull('checklist_key')
            ->orderBy('created_at')
            ->get()
            ->groupBy('checklist_key')
            ->map(fn ($files) => $files->map(fn ($f) => [
                'id' => $f->id,
                'original_name' => $f->original_name,
                'mime' => $f->mime,
                'size' => $f->size,
                'status' => $f->status,
                'source' => $f->source,
                'source_variant' => $f->source_variant,
                'created_at' => $f->created_at,
            ])->values());

        return inertia('portal/lead/Documents', [
            'lead' => [
                'id' => $lead->id,
                'lead_id' => $lead->lead_id,
                'first_name' => $lead->first_name,
                'last_name' => $lead->last_name,
                'agreements_acknowledged_at' => $lead->agreements_acknowledged_at,
            ],
            'requests' => $requests,
            'shared_by_staff' => $sharedByStaff,
            'checklistFiles' => $checklistFiles,
            'sectionVerifications' => $lead->section_verifications ?? [],
        ]);
    }

    /**
     * Lead uploads one-or-many files against a Documents-tab checklist
     * item from their own portal.
     */
    public function leadChecklistUpload(Request $request, $key)
    {
        $user = Auth::user();
        $lead = $user?->lead;
        abort_unless($lead, 403);

        $request->validate([
            'files' => 'required|array|min:1|max:10',
            'files.*' => UploadValidation::document(),
        ]);

        try {
            $lastDoc = null;
            foreach ($request->file('files') as $file) {
                [$path, $displayName] = $this->storeChecklistFile($file, $lead, $key);

                $lastDoc = LeadDocument::create([
                    'lead_id' => $lead->id,
                    'request_id' => null,
                    'checklist_key' => $key,
                    'original_name' => $displayName,
                    'file_path' => $path,
                    'mime' => $file->getMimeType(),
                    'size' => $file->getSize(),
                    'status' => LeadDocument::STATUS_SUBMITTED,
                    'uploaded_by' => $user->id,
                ]);
            }

            // One notification per upload batch (not per file).
            if ($lastDoc) {
                $this->notifyDocumentSubmitted($lead, $lastDoc);
            }

            return back()->with('success', 'Document uploaded. Our team will review it shortly.');
        } catch (\Throwable $e) {
            Log::error('Lead checklist upload failed', ['lead_id' => $lead->id, 'key' => $key, 'error' => $e->getMessage()]);

            return back()->withErrors(['error' => 'Upload failed. Please try again.']);
        }
    }

    /**
     * Lead flips a checklist section into "in_review" so staff knows to
     * verify it. Lead can only do this for their own lead record.
     */
    public function leadSubmitSection(Request $request, $sectionKey)
    {
        $user = Auth::user();
        $lead = $user?->lead;
        abort_unless($lead, 403);

        try {
            $sections = is_array($lead->section_verifications) ? $lead->section_verifications : [];
            $sections[$sectionKey] = [
                'status' => 'in_review',
                'submitted_at' => now()->toIso8601String(),
            ];
            $lead->section_verifications = $sections;
            $lead->save();

            return back()->with('success', 'Section submitted for review.');
        } catch (\Throwable $e) {
            Log::error('Lead section submit failed', ['lead_id' => $lead->id, 'section' => $sectionKey, 'error' => $e->getMessage()]);

            return back()->withErrors(['error' => 'Could not submit section.']);
        }
    }

    /**
     * Notify the lead's assigned staff (or admins as a fallback) that the
     * lead submitted a document — same alert the public /track upload fires.
     */
    private function notifyDocumentSubmitted(Lead $lead, LeadDocument $document): void
    {
        try {
            $recipients = $lead->assignee
                ? collect([$lead->assignee])
                : \App\Models\User::whereIn('role', [\App\Models\User::ROLE_ADMIN, \App\Models\User::ROLE_SUPER_ADMIN])->get();

            // Immigration cases always loop in the immigration team so the
            // department hears about document activity on their own cases.
            if ($lead->is_immigration_case) {
                $immigration = \App\Models\User::whereIn('role', array_merge(['immigration'], \App\Models\User::IMMIGRATION_ROLES))->get();
                $recipients = $recipients->merge($immigration)->unique('id')->values();
            }

            if ($recipients->isNotEmpty()) {
                \Illuminate\Support\Facades\Notification::send(
                    $recipients,
                    new \App\Notifications\DocumentSubmittedForReview($lead, $document)
                );
            }
        } catch (\Throwable $e) {
            Log::error('Lead-portal document notify failed', ['lead_id' => $lead->id, 'error' => $e->getMessage()]);
        }
    }

    public function leadUpload(Request $request)
    {
        $user = Auth::user();
        $lead = $user?->lead;
        abort_unless($lead, 403);

        $request->validate([
            'file' => 'required|'.UploadValidation::document(),
            'request_id' => 'nullable|integer|exists:lead_document_requests,id',
        ]);

        // If responding to a request, verify it belongs to this lead
        if ($request->filled('request_id')) {
            $req = LeadDocumentRequest::where('lead_id', $lead->id)
                ->where('id', $request->input('request_id'))
                ->first();
            abort_unless($req, 403, 'Request does not belong to you.');
        }

        $path = $request->file('file')->store("lead-documents/{$lead->id}", self::DISK);

        $document = LeadDocument::create([
            'lead_id' => $lead->id,
            'request_id' => $request->input('request_id'),
            'original_name' => $request->file('file')->getClientOriginalName(),
            'file_path' => $path,
            'mime' => $request->file('file')->getMimeType(),
            'size' => $request->file('file')->getSize(),
            'status' => LeadDocument::STATUS_SUBMITTED,
            'uploaded_by' => $user->id,
        ]);

        $this->notifyDocumentSubmitted($lead, $document);

        return back()->with('success', 'Document uploaded. Our team will review it shortly.');
    }

    // ── DOWNLOAD — role-gated ───────────────────────────────────────────────

    public function download(Request $request, $docId)
    {
        $doc = LeadDocument::findOrFail($docId);
        $user = Auth::user();

        // Lead users can only download files tied to their own lead record.
        if ($user->isLead()) {
            abort_unless($user->lead_id === $doc->lead_id, 403);
        }

        // Disk inconsistency: tracker-side uploads (LeadTrackingController::uploadDoc)
        // land on the 'public' disk; staff-side uploads (staffChecklistUpload, leadUpload)
        // land on the 'local' (private) disk. The download controller has to handle
        // both so a file uploaded via either path is viewable. Local wins when present
        // to keep private uploads from being accidentally moved to a public disk later.
        $disk = Storage::disk(self::DISK)->exists($doc->file_path)
            ? self::DISK
            : (Storage::disk('public')->exists($doc->file_path) ? 'public' : null);
        abort_unless($disk, 404);

        // ?inline=1 streams with Content-Disposition: inline so the browser
        // renders the PDF in-tab instead of forcing a download — used by the
        // "View" button on the agreements panel.
        if ($request->boolean('inline')) {
            return response()->file(Storage::disk($disk)->path($doc->file_path), [
                'Content-Type' => $doc->mime ?: 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.$doc->original_name.'"',
            ]);
        }

        return Storage::disk($disk)->download($doc->file_path, $doc->original_name);
    }

    /**
     * Bundle every document on a lead into a single ZIP and stream it.
     * Staff-only (this route lives in the staff group); a lead may only
     * pull their own. Files live on either the private ('local') or
     * 'public' disk, so each is resolved the same way download() does.
     */
    public function downloadAll(Request $request, $leadId)
    {
        $lead = Lead::findOrFail($leadId);
        $user = Auth::user();

        if ($user->isLead()) {
            abort_unless($user->lead_id === $lead->id, 403);
        }

        if (! class_exists(\ZipArchive::class)) {
            return back()->withErrors(['error' => 'ZIP support is not available on the server.']);
        }

        $docs = $lead->documents()->orderBy('created_at')->get();
        if ($docs->isEmpty()) {
            return back()->withErrors(['error' => 'This case has no documents to download.']);
        }

        $tmp = tempnam(sys_get_temp_dir(), 'leaddocs_');
        $zip = new \ZipArchive;
        if ($zip->open($tmp, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            @unlink($tmp);

            return back()->withErrors(['error' => 'Could not create the ZIP archive.']);
        }

        $used = [];
        $added = 0;
        foreach ($docs as $doc) {
            $disk = Storage::disk(self::DISK)->exists($doc->file_path)
                ? self::DISK
                : (Storage::disk('public')->exists($doc->file_path) ? 'public' : null);
            if (! $disk) {
                continue;
            }

            $name = $this->uniqueZipEntry($used, $doc->original_name ?: basename($doc->file_path));
            $used[strtolower($name)] = true;

            $zip->addFile(Storage::disk($disk)->path($doc->file_path), $name);
            $added++;
        }
        $zip->close();

        if ($added === 0) {
            @unlink($tmp);

            return back()->withErrors(['error' => 'No downloadable files were found for this case.']);
        }

        $slug = Str::slug(trim("{$lead->first_name} {$lead->last_name}")) ?: ('case-'.$lead->id);

        return response()->download($tmp, "{$slug}-documents.zip", [
            'Content-Type' => 'application/zip',
        ])->deleteFileAfterSend(true);
    }

    /**
     * Toggle whether a checklist item is hidden from the applicant's public
     * tracking link. Staff-only; stored per-case on
     * leads.hidden_track_documents.
     */
    public function toggleTrackVisibility(Request $request, $leadId)
    {
        $lead = Lead::findOrFail($leadId);

        // Accepts one or many keys so a single row checkbox and a
        // section-level "select all" both hit the same endpoint.
        $data = $request->validate([
            'checklist_keys' => 'required|array|min:1',
            'checklist_keys.*' => 'string|max:80',
            'hidden' => 'required|boolean',
        ]);

        $hidden = array_values(array_unique(array_filter(
            is_array($lead->hidden_track_documents) ? $lead->hidden_track_documents : []
        )));

        foreach ($data['checklist_keys'] as $key) {
            if ($data['hidden']) {
                if (! in_array($key, $hidden, true)) {
                    $hidden[] = $key;
                }
            } else {
                $hidden = array_filter($hidden, fn ($k) => $k !== $key);
            }
        }

        $lead->hidden_track_documents = array_values($hidden);
        $lead->save();

        return back()->with('success', $data['hidden'] ? 'Hidden from the tracker.' : 'Shown on the tracker.');
    }

    /**
     * Return a ZIP entry name that doesn't collide with one already added,
     * appending " (2)", " (3)", … before the extension when needed.
     */
    private function uniqueZipEntry(array $used, string $name): string
    {
        if (! isset($used[strtolower($name)])) {
            return $name;
        }

        $ext = pathinfo($name, PATHINFO_EXTENSION);
        $base = $ext !== '' ? substr($name, 0, -(strlen($ext) + 1)) : $name;

        $i = 2;
        do {
            $candidate = $ext !== '' ? "{$base} ({$i}).{$ext}" : "{$base} ({$i})";
            $i++;
        } while (isset($used[strtolower($candidate)]));

        return $candidate;
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private function docSerialize(LeadDocument $d): array
    {
        return [
            'id' => $d->id,
            'request_id' => $d->request_id,
            'original_name' => $d->original_name,
            'mime' => $d->mime,
            'size' => $d->size,
            'status' => $d->status,
            'source' => $d->source,
            'source_variant' => $d->source_variant,
            'note' => $d->note,
            'reviewed_at' => $d->reviewed_at,
            'created_at' => $d->created_at,
        ];
    }

    /**
     * Document templates a staff member can pick from. Tuned for the
     * education + immigration flows per this phase's scope.
     */
    private function requestTemplates(): array
    {
        return [
            ['label' => 'Passport bio page',          'description' => 'Clear scan or photo of the photo page'],
            ['label' => 'Birth certificate',          'description' => 'Original or certified copy'],
            ['label' => 'Academic transcripts',       'description' => 'From your most recent institution'],
            ['label' => 'Diploma / degree certificate', 'description' => 'Highest qualification completed'],
            ['label' => 'IELTS / English test result', 'description' => 'Within last 2 years'],
            ['label' => 'Curriculum vitae (CV)',      'description' => 'PDF or DOCX, max 4 pages'],
            ['label' => 'Employment letter',          'description' => 'On company letterhead'],
            ['label' => 'Bank statement',             'description' => 'Last 3-6 months'],
            ['label' => 'Police clearance certificate', 'description' => 'For immigration applications'],
            ['label' => 'Medical certificate',        'description' => 'INZ-approved panel doctor'],
        ];
    }
}
