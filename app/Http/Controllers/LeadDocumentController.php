<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\LeadDocumentRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
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
                LeadDocumentRequest::create([
                    'lead_id'      => $lead->id,
                    'label'        => $item['label'],
                    'description'  => $item['description'] ?? null,
                    'required'     => $item['required'] ?? true,
                    'requested_by' => Auth::id(),
                    'requested_at' => now(),
                ]);
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

        return back()->with('success', "Document marked {$validated['status']}.");
    }

    public function shareWithLead(Request $request, $leadId)
    {
        $lead = Lead::findOrFail($leadId);
        $request->validate([
            'file' => 'required|file|max:20480', // 20MB
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

        return inertia('portal/lead/Documents', [
            'lead'           => ['lead_id' => $lead->lead_id, 'first_name' => $lead->first_name],
            'requests'       => $requests,
            'shared_by_staff' => $sharedByStaff,
        ]);
    }

    public function leadUpload(Request $request)
    {
        $user = Auth::user();
        $lead = $user?->lead;
        abort_unless($lead, 403);

        $request->validate([
            'file'       => 'required|file|max:20480', // 20MB
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

        LeadDocument::create([
            'lead_id'       => $lead->id,
            'request_id'    => $request->input('request_id'),
            'original_name' => $request->file('file')->getClientOriginalName(),
            'file_path'     => $path,
            'mime'          => $request->file('file')->getMimeType(),
            'size'          => $request->file('file')->getSize(),
            'status'        => LeadDocument::STATUS_SUBMITTED,
            'uploaded_by'   => $user->id,
        ]);

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

        abort_unless(Storage::disk(self::DISK)->exists($doc->file_path), 404);

        return Storage::disk(self::DISK)->download($doc->file_path, $doc->original_name);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private function docSerialize(LeadDocument $d): array
    {
        return [
            'id'           => $d->id,
            'request_id'   => $d->request_id,
            'original_name' => $d->original_name,
            'mime'         => $d->mime,
            'size'         => $d->size,
            'status'       => $d->status,
            'note'         => $d->note,
            'reviewed_at'  => $d->reviewed_at,
            'created_at'   => $d->created_at,
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
