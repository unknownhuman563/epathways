<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\LeadDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/**
 * Public lead-tracking + self-service endpoint. Drives the /track route
 * that the department pastes to clients — they enter no password, only
 * their tracking_code (which is itself the bearer credential).
 *
 * Three responsibilities:
 *   - show()         : render the tracking page with info, documents and timeline
 *   - update()       : let the lead edit a tightly-scoped allow-list of
 *                      personal fields directly from /track/{code}
 *   - uploadDoc()    : let the lead upload a supporting document
 *
 * Everything else (stage, conversion flags, internal notes, AI score,
 * passport scans, financial info) stays read-only or hidden.
 */
class LeadTrackingController extends Controller
{
    /**
     * Fields the lead is allowed to self-edit from the public page.
     * Anything outside this list is silently dropped on update().
     */
    private const EDITABLE = [
        'first_name', 'middle_name', 'last_name', 'other_names',
        'gender', 'marital_status', 'dob',
        'email', 'phone',
        'country_of_birth', 'place_of_birth', 'citizenship',
        'residence_city', 'residence_state', 'residence_country',
        'has_passport', 'passport_number', 'passport_expiry',
    ];

    public function show(Request $request, ?string $code = null)
    {
        $code = $code ?: $request->query('code');

        $payload = [
            'code'      => $code,
            'lead'      => null,
            'info'      => null,
            'documents' => [],
            'timeline'  => [],
            'error'     => null,
        ];

        if (! $code) {
            return inertia('track/TrackingPage', $payload);
        }

        $lead = $this->resolveLead($code);

        if (! $lead) {
            $payload['error'] = 'We could not find an application with that tracking code. Please double-check it and try again.';

            return inertia('track/TrackingPage', $payload);
        }

        $payload['lead']      = $this->publicLeadShape($lead);
        $payload['info']      = $this->editableInfo($lead);
        $payload['documents'] = $this->publicDocuments($lead);
        $payload['timeline']  = $this->buildTimeline($lead);

        return inertia('track/TrackingPage', $payload);
    }

    /**
     * Save edits the lead makes on the public tracking page. Only the
     * allow-listed fields are accepted; everything else is ignored.
     */
    public function update(Request $request, string $code)
    {
        $lead = $this->resolveLead($code);

        if (! $lead) {
            return back()->with('error', 'Tracking code not recognised.');
        }

        $validated = $request->validate([
            'first_name'        => 'nullable|string|max:80',
            'middle_name'       => 'nullable|string|max:80',
            'last_name'         => 'nullable|string|max:80',
            'other_names'       => 'nullable|string|max:120',
            'gender'            => 'nullable|string|max:30',
            'marital_status'    => 'nullable|string|max:30',
            'dob'               => 'nullable|date',
            'email'             => 'nullable|email|max:120',
            'phone'             => 'nullable|string|max:40',
            'country_of_birth'  => 'nullable|string|max:80',
            'place_of_birth'    => 'nullable|string|max:120',
            'citizenship'       => 'nullable|string|max:80',
            'residence_city'    => 'nullable|string|max:80',
            'residence_state'   => 'nullable|string|max:80',
            'residence_country' => 'nullable|string|max:80',
            'has_passport'      => ['nullable', Rule::in(['Yes', 'No'])],
            'passport_number'   => 'nullable|string|max:40',
            'passport_expiry'   => 'nullable|date',
        ]);

        // The allow-list filter is redundant after the validator, but
        // belt-and-braces in case future validation rules drift.
        $lead->fill(array_intersect_key($validated, array_flip(self::EDITABLE)));
        $lead->save();

        return redirect()
            ->route('track.lookup', ['code' => $lead->tracking_code])
            ->with('success', 'Your information has been updated.');
    }

    /**
     * Lead-side document upload. Reuses the existing LeadDocument model
     * so admin tooling treats these uploads identically to staff-shared
     * or portal-uploaded files.
     */
    public function uploadDoc(Request $request, string $code)
    {
        $lead = $this->resolveLead($code);

        if (! $lead) {
            return back()->with('error', 'Tracking code not recognised.');
        }

        $request->validate([
            'file' => 'required|file|mimes:pdf,doc,docx,xls,csv,jpg,jpeg,png,gif|max:10240',
            'checklist_key' => 'nullable|string|max:80',
            // Optional metadata captured at upload-time for passport docs so
            // the lead doesn't have to re-enter passport number / expiry in
            // a separate form. Both fields are nullable for non-passport
            // uploads and silently ignored if checklist_key !== 'passport'.
            'passport_number' => 'nullable|string|max:40',
            'passport_expiry' => 'nullable|date',
        ]);

        $file = $request->file('file');
        $path = $file->store("lead-documents/{$lead->id}", 'public');

        $checklistKey = $request->input('checklist_key');

        LeadDocument::create([
            'lead_id'       => $lead->id,
            'checklist_key' => $checklistKey,
            'original_name' => $file->getClientOriginalName(),
            'file_path'     => $path,
            'mime'          => $file->getMimeType(),
            'size'          => $file->getSize(),
            'status'        => LeadDocument::STATUS_SUBMITTED,
            'source'        => LeadDocument::SOURCE_UPLOAD,
        ]);

        // Passport upload: surface the entered passport metadata onto the
        // lead row itself so admin search / visa lodgement / immigration
        // workflows pick it up without anyone re-keying. We also store the
        // file path so the passport scan is the authoritative source if
        // the staff need to verify the typed numbers.
        if ($checklistKey === 'passport') {
            $patch = ['has_passport' => 'Yes', 'passport_path' => $path];
            if ($request->filled('passport_number')) {
                $patch['passport_number'] = $request->input('passport_number');
            }
            if ($request->filled('passport_expiry')) {
                $patch['passport_expiry'] = $request->input('passport_expiry');
            }
            $lead->fill($patch)->save();
        }

        return redirect()
            ->route('track.lookup', ['code' => $lead->tracking_code])
            ->with('success', 'Your document has been uploaded.');
    }

    /**
     * Replace the file (and optionally the type) on a document the lead
     * already uploaded. Only allowed while the document is still in
     * Submitted state — once a staff member has reviewed it, the lead can
     * no longer self-edit. Avoids leads silently swapping out an approved
     * passport scan after the fact.
     */
    public function updateDoc(Request $request, string $code, int $docId)
    {
        $lead = $this->resolveLead($code);
        if (! $lead) {
            return back()->with('error', 'Tracking code not recognised.');
        }

        $doc = LeadDocument::where('id', $docId)
            ->where('lead_id', $lead->id)
            ->first();

        if (! $doc) {
            return back()->with('error', 'Document not found.');
        }

        // Staff has already touched this doc — lock it for the lead.
        if ($doc->status !== LeadDocument::STATUS_SUBMITTED) {
            return back()->with('error', 'This document has already been reviewed and can no longer be edited.');
        }

        $request->validate([
            'file' => 'nullable|file|mimes:pdf,doc,docx,xls,csv,jpg,jpeg,png,gif|max:10240',
            'checklist_key' => 'nullable|string|max:80',
        ]);

        if ($request->hasFile('file')) {
            // Best-effort: drop the old file so we don't accumulate
            // orphans. We swallow failures because the audit value of
            // keeping the LeadDocument row beats blocking the lead on a
            // disk hiccup.
            if ($doc->file_path) {
                try { Storage::disk('public')->delete($doc->file_path); } catch (\Throwable $e) { /* noop */ }
            }
            $file = $request->file('file');
            $path = $file->store("lead-documents/{$lead->id}", 'public');

            $doc->fill([
                'original_name' => $file->getClientOriginalName(),
                'file_path'     => $path,
                'mime'          => $file->getMimeType(),
                'size'          => $file->getSize(),
            ]);
        }

        if ($request->filled('checklist_key')) {
            $doc->checklist_key = $request->input('checklist_key');
        }

        $doc->save();

        return redirect()
            ->route('track.lookup', ['code' => $lead->tracking_code])
            ->with('success', 'Document updated.');
    }

    /**
     * Lead-side delete for a still-pending document. Same status guard as
     * updateDoc — once reviewed, only staff can remove it.
     */
    public function deleteDoc(Request $request, string $code, int $docId)
    {
        $lead = $this->resolveLead($code);
        if (! $lead) {
            return back()->with('error', 'Tracking code not recognised.');
        }

        $doc = LeadDocument::where('id', $docId)
            ->where('lead_id', $lead->id)
            ->first();

        if (! $doc) {
            return back()->with('error', 'Document not found.');
        }

        if ($doc->status !== LeadDocument::STATUS_SUBMITTED) {
            return back()->with('error', 'This document has already been reviewed and can no longer be deleted.');
        }

        if ($doc->file_path) {
            try { Storage::disk('public')->delete($doc->file_path); } catch (\Throwable $e) { /* noop */ }
        }
        $doc->delete();

        return redirect()
            ->route('track.lookup', ['code' => $lead->tracking_code])
            ->with('success', 'Document removed.');
    }

    // ─── helpers ────────────────────────────────────────────────────────

    private function resolveLead(string $code): ?Lead
    {
        return Lead::where('tracking_code', strtoupper(trim($code)))->first();
    }

    private function publicLeadShape(Lead $lead): array
    {
        return [
            'tracking_code' => $lead->tracking_code,
            'first_name'    => $lead->first_name,
            'last_name'     => $lead->last_name,
            'stage'         => $lead->stage,
            'created_at'    => optional($lead->created_at)?->toIso8601String(),
            'is_student'    => (bool) $lead->is_student,
            'is_immigration_case'     => (bool) $lead->is_immigration_case,
            'is_accommodation_client' => (bool) $lead->is_accommodation_client,
        ];
    }

    /**
     * Editable fields pre-filled for the form. Mirrors self::EDITABLE so
     * we always serialise the same shape the frontend expects.
     */
    private function editableInfo(Lead $lead): array
    {
        return collect(self::EDITABLE)
            ->mapWithKeys(fn ($key) => [$key => $lead->{$key}])
            ->toArray();
    }

    private function publicDocuments(Lead $lead): array
    {
        return $lead->documents()
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (LeadDocument $d) => [
                'id'            => $d->id,
                'original_name' => $d->original_name,
                'checklist_key' => $d->checklist_key,
                'size'          => $d->size,
                'mime'          => $d->mime,
                'status'        => $d->status,
                'source'        => $d->source,
                'created_at'    => $d->created_at?->toIso8601String(),
                // Public storage URL — drives the gallery thumbnail click
                // and the inline image preview for jpeg/png uploads.
                'url'           => $d->file_path ? Storage::disk('public')->url($d->file_path) : null,
                'is_image'      => str_starts_with((string) $d->mime, 'image/'),
                // Lead can only edit / delete while the doc is still
                // pending review. Once a staff member touches it the
                // controller rejects the change anyway, but we surface the
                // flag so the UI can hide the action buttons cleanly.
                'is_editable'   => $d->status === LeadDocument::STATUS_SUBMITTED,
            ])
            ->all();
    }

    /**
     * Canonical roadmap of journey milestones. Each step is always present
     * (whether or not it has happened yet) so the frontend can render a
     * Completed / In Progress / Pending pattern matching the reference
     * design. Status is computed left-to-right: every step with a
     * timestamp = completed; the first step without = current ("In
     * Progress"); everything after = pending.
     */
    private function buildTimeline(Lead $lead): array
    {
        $earliestConversion = collect([
            $lead->student_converted_at,
            $lead->immigration_converted_at,
            $lead->accommodation_converted_at,
        ])->filter()->sort()->first();

        // Curated roadmap. Edit copy / order in one place.
        $milestones = [
            ['key' => 'enquiry',       'label' => 'Enquiry',            'at' => $lead->created_at],
            ['key' => 'first_contact', 'label' => 'First Contact',      'at' => $lead->date_of_first_contact],
            ['key' => 'engagement',    'label' => 'Engagement',         'at' => $lead->date_of_engagement],
            ['key' => 'agreement',     'label' => 'Services Agreement', 'at' => $lead->services_agreement_signed_at],
            ['key' => 'conversion',    'label' => 'Department Assigned','at' => $earliestConversion],
            ['key' => 'inz_lodged',    'label' => 'Lodged with INZ',    'at' => $lead->inz_lodged_at],
            ['key' => 'inz_decision',  'label' => 'INZ Decision',       'at' => $lead->inz_decision_at],
        ];

        $journey = [];
        $foundCurrent = false;

        foreach ($milestones as $m) {
            if ($m['at']) {
                $status = 'completed';
            } elseif (! $foundCurrent) {
                $status = 'current';
                $foundCurrent = true;
            } else {
                $status = 'pending';
            }

            $journey[] = [
                'key'    => $m['key'],
                'label'  => $m['label'],
                'status' => $status,
                'at'     => $m['at'] ? Carbon::parse($m['at'])->toIso8601String() : null,
            ];
        }

        return $journey;
    }
}
