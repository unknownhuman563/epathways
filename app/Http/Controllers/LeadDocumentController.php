<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\LeadDocumentRequest;
use App\Services\AgreementGenerator;
use App\Support\UploadValidation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
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

    // ── STAFF (admin / sales) ───────────────────────────────────────────────

    public function staffIndex(Request $request, $leadId)
    {
        $lead = Lead::findOrFail($leadId);

        $requests = $lead->loadMissing(['documentRequests.requester:id,name', 'documentRequests.latestDocument'])
            ->documentRequests()
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (LeadDocumentRequest $r) => [
                'id'           => $r->id,
                'label'        => $r->label,
                'description'  => $r->description,
                'required'     => $r->required,
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
                'id'         => $lead->id,
                'lead_id'    => $lead->lead_id,
                'name'       => trim("{$lead->first_name} {$lead->last_name}"),
                'email'      => $lead->email,
                'status'     => $lead->status,
                'stage'      => $lead->stage,
                'source'     => $lead->source,
                'portal_invitation_status' => $lead->portal_invitation_status,
            ],
            'requests' => $requests,
            'orphans'  => $orphans,
            'templates' => $this->requestTemplates(),
        ]);
    }

    public function requestStore(Request $request, $leadId)
    {
        $lead = Lead::findOrFail($leadId);

        $data = $request->validate([
            'items'                 => 'required|array|min:1|max:20',
            'items.*.label'         => 'required|string|max:120',
            'items.*.description'   => 'nullable|string|max:500',
            'items.*.required'      => 'sometimes|boolean',
        ]);

        try {
            foreach ($data['items'] as $item) {
                $docRequest = LeadDocumentRequest::create([
                    'lead_id'      => $lead->id,
                    'label'        => $item['label'],
                    'description'  => $item['description'] ?? null,
                    'required'     => $item['required'] ?? true,
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
            return back()->with('success', count($data['items']) . ' document request(s) added.');
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
                LeadDocument::STATUS_UNDER_REVIEW,
                LeadDocument::STATUS_APPROVED,
                LeadDocument::STATUS_REJECTED,
            ])],
            'note'   => 'nullable|string|max:500',
        ]);

        $doc->update([
            'status'      => $validated['status'],
            'note'        => $validated['note'] ?? $doc->note,
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
                    'reason'        => $validated['note'] ?? '',
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
            'file' => 'required|' . UploadValidation::document(),
            'note' => 'nullable|string|max:500',
        ]);

        $path = $request->file('file')->store("lead-documents/{$lead->id}", self::DISK);

        LeadDocument::create([
            'lead_id'       => $lead->id,
            'request_id'    => null,
            'original_name' => $request->file('file')->getClientOriginalName(),
            'file_path'     => $path,
            'mime'          => $request->file('file')->getMimeType(),
            'size'          => $request->file('file')->getSize(),
            'status'        => LeadDocument::STATUS_STAFF_SHARED,
            'note'          => $request->input('note'),
            'uploaded_by'   => Auth::id(),
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
            'files'   => 'required|array|min:1|max:10',
            'files.*' => UploadValidation::document(),
        ]);

        try {
            foreach ($request->file('files') as $file) {
                $path = $file->store("lead-documents/{$lead->id}", self::DISK);

                LeadDocument::create([
                    'lead_id'       => $lead->id,
                    'request_id'    => null,
                    'checklist_key' => $key,
                    'original_name' => $file->getClientOriginalName(),
                    'file_path'     => $path,
                    'mime'          => $file->getMimeType(),
                    'size'          => $file->getSize(),
                    'status'        => LeadDocument::STATUS_SUBMITTED,
                    'uploaded_by'   => Auth::id(),
                ]);
            }

            $n = count($request->file('files'));
            return back()->with('success', "{$n} " . ($n === 1 ? 'file' : 'files') . " uploaded.");
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
                'key'     => $key,
                'variant' => $data['variant'] ?? null,
                'error'   => $e->getMessage(),
            ]);
            return back()->withErrors(['error' => 'Could not generate the agreement: ' . $e->getMessage()]);
        }
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
                'id'           => $r->id,
                'label'        => $r->label,
                'description'  => $r->description,
                'required'     => $r->required,
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
                'id'             => $f->id,
                'original_name'  => $f->original_name,
                'mime'           => $f->mime,
                'size'           => $f->size,
                'status'         => $f->status,
                'source'         => $f->source,
                'source_variant' => $f->source_variant,
                'created_at'     => $f->created_at,
            ])->values());

        return inertia('portal/lead/Documents', [
            'lead'                  => [
                'id'         => $lead->id,
                'lead_id'    => $lead->lead_id,
                'first_name' => $lead->first_name,
                'last_name'  => $lead->last_name,
                'agreements_acknowledged_at' => $lead->agreements_acknowledged_at,
            ],
            'requests'              => $requests,
            'shared_by_staff'       => $sharedByStaff,
            'checklistFiles'        => $checklistFiles,
            'sectionVerifications'  => $lead->section_verifications ?? [],
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
            'files'   => 'required|array|min:1|max:10',
            'files.*' => UploadValidation::document(),
        ]);

        try {
            $lastDoc = null;
            foreach ($request->file('files') as $file) {
                $path = $file->store("lead-documents/{$lead->id}", self::DISK);

                $lastDoc = LeadDocument::create([
                    'lead_id'       => $lead->id,
                    'request_id'    => null,
                    'checklist_key' => $key,
                    'original_name' => $file->getClientOriginalName(),
                    'file_path'     => $path,
                    'mime'          => $file->getMimeType(),
                    'size'          => $file->getSize(),
                    'status'        => LeadDocument::STATUS_SUBMITTED,
                    'uploaded_by'   => $user->id,
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
                'status'       => 'in_review',
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
            'file'       => 'required|' . UploadValidation::document(),
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
            'lead_id'       => $lead->id,
            'request_id'    => $request->input('request_id'),
            'original_name' => $request->file('file')->getClientOriginalName(),
            'file_path'     => $path,
            'mime'          => $request->file('file')->getMimeType(),
            'size'          => $request->file('file')->getSize(),
            'status'        => LeadDocument::STATUS_SUBMITTED,
            'uploaded_by'   => $user->id,
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
                'Content-Type'        => $doc->mime ?: 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . $doc->original_name . '"',
            ]);
        }

        return Storage::disk($disk)->download($doc->file_path, $doc->original_name);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private function docSerialize(LeadDocument $d): array
    {
        return [
            'id'             => $d->id,
            'request_id'     => $d->request_id,
            'original_name'  => $d->original_name,
            'mime'           => $d->mime,
            'size'           => $d->size,
            'status'         => $d->status,
            'source'         => $d->source,
            'source_variant' => $d->source_variant,
            'note'           => $d->note,
            'reviewed_at'    => $d->reviewed_at,
            'created_at'     => $d->created_at,
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
            ['label' => 'Diploma / degree certificate','description' => 'Highest qualification completed'],
            ['label' => 'IELTS / English test result', 'description' => 'Within last 2 years'],
            ['label' => 'Curriculum vitae (CV)',      'description' => 'PDF or DOCX, max 4 pages'],
            ['label' => 'Employment letter',          'description' => 'On company letterhead'],
            ['label' => 'Bank statement',             'description' => 'Last 3-6 months'],
            ['label' => 'Police clearance certificate','description' => 'For immigration applications'],
            ['label' => 'Medical certificate',        'description' => 'INZ-approved panel doctor'],
        ];
    }
}
