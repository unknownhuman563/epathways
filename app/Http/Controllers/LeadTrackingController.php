<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\User;
use App\Models\VisaType;
use App\Notifications\DocumentSubmittedForReview;
use App\Notifications\LeadInfoUpdated;
use App\Support\UploadValidation;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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
            'code' => $code,
            'lead' => null,
            'info' => null,
            'documents' => [],
            'agreements' => [],
            'timeline' => [],
            'visa' => null,
            'error' => null,
        ];

        if (! $code) {
            return inertia('track/TrackingPage', $payload);
        }

        $lead = $this->resolveLead($code);

        if (! $lead) {
            // Friendly "not found" — the same tracker shell with a message,
            // but a real 404 status so it isn't mistaken for a valid page.
            $payload['error'] = 'We could not find an application with that tracking code. Please double-check it and try again.';

            return inertia('track/TrackingPage', $payload)->toResponse($request)->setStatusCode(404);
        }

        $this->recordVisit($request, $lead);

        $payload['lead'] = $this->publicLeadShape($lead);
        $payload['info'] = $this->editableInfo($lead);
        $payload['documents'] = $this->publicDocuments($lead);
        $payload['agreements'] = $this->publicAgreements($lead, $code);
        // Immigration cases get the 12-step "My Visa Application Journey"
        // roadmap; everyone else (general leads / education students)
        // keeps the high-level 7-step pipeline view.
        $payload['timeline'] = $lead->is_immigration_case
            ? $this->buildImmigrationJourney($lead)
            : $this->buildTimeline($lead);
        $payload['visa'] = $this->resolveVisa($lead);

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
            'first_name' => 'nullable|string|max:80',
            'middle_name' => 'nullable|string|max:80',
            'last_name' => 'nullable|string|max:80',
            'other_names' => 'nullable|string|max:120',
            'gender' => 'nullable|string|max:30',
            'marital_status' => 'nullable|string|max:30',
            'dob' => 'nullable|date',
            'email' => 'nullable|email|max:120',
            'phone' => 'nullable|string|max:40',
            'country_of_birth' => 'nullable|string|max:80',
            'place_of_birth' => 'nullable|string|max:120',
            'citizenship' => 'nullable|string|max:80',
            'residence_city' => 'nullable|string|max:80',
            'residence_state' => 'nullable|string|max:80',
            'residence_country' => 'nullable|string|max:80',
            'has_passport' => ['nullable', Rule::in(['Yes', 'No'])],
            'passport_number' => 'nullable|string|max:40',
            'passport_expiry' => 'nullable|date',
        ]);

        // The allow-list filter is redundant after the validator, but
        // belt-and-braces in case future validation rules drift.
        $filtered = array_intersect_key($validated, array_flip(self::EDITABLE));

        // Compute the change set on DECRYPTED values (encrypted casts would
        // otherwise always read as "dirty"). Sensitive fields are redacted —
        // we record THAT they changed, never the values.
        $sensitive = ['passport_number'];
        $changes = [];
        foreach ($filtered as $field => $new) {
            $old = $lead->{$field};
            if ((string) $old !== (string) $new) {
                $changes[$field] = in_array($field, $sensitive, true)
                    ? ['old' => '[redacted]', 'new' => '[updated]']
                    : ['old' => $old, 'new' => $new];
            }
        }

        // saveQuietly so the LogsActivity trait's null-actor auto-log doesn't
        // fire — we record a tailored entry with the tracking_code as actor.
        $lead->fill($filtered)->saveQuietly();

        if (! empty($changes)) {
            ActivityLog::record('lead.updated', [
                'actor_name' => $lead->tracking_code,
                'actor_role' => 'tracker',
                'portal' => 'public',
                'entity_type' => Lead::class,
                'entity_id' => $lead->id,
                'description' => 'Lead updated their information via the tracker',
                'properties' => [
                    'subject_type' => 'Lead',
                    'subject_id' => $lead->id,
                    'changes' => $changes,
                ],
            ]);
        }

        // Notify staff when a key identity/contact field changes.
        $keyFields = array_values(array_intersect(array_keys($changes), ['passport_number', 'phone', 'email']));
        if (! empty($keyFields)) {
            $recipients = $this->staffRecipients($lead);
            if ($recipients->isNotEmpty()) {
                Notification::send($recipients, new LeadInfoUpdated($lead, $keyFields));
            }
        }

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
            'file' => 'required|'.UploadValidation::document(),
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

        $document = LeadDocument::create([
            'lead_id' => $lead->id,
            'checklist_key' => $checklistKey,
            'original_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime' => $file->getMimeType(),
            'size' => $file->getSize(),
            'status' => LeadDocument::STATUS_SUBMITTED,
            'source' => LeadDocument::SOURCE_UPLOAD,
        ]);

        $this->notifyDocumentSubmitted($lead, $document, 'submitted');

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

        // Once staff has approved a doc it's locked; the lead may still fix a
        // pending / under-review / rejected one.
        if ($doc->status === LeadDocument::STATUS_APPROVED) {
            return back()->with('error', 'This document has been approved and can no longer be edited.');
        }

        $request->validate([
            'file' => 'nullable|'.UploadValidation::document(),
            'checklist_key' => 'nullable|string|max:80',
        ]);

        $replacedFile = false;
        if ($request->hasFile('file')) {
            // Best-effort: drop the old file so we don't accumulate
            // orphans. We swallow failures because the audit value of
            // keeping the LeadDocument row beats blocking the lead on a
            // disk hiccup.
            if ($doc->file_path) {
                try {
                    Storage::disk('public')->delete($doc->file_path);
                } catch (\Throwable $e) { /* noop */
                }
            }
            $file = $request->file('file');
            $path = $file->store("lead-documents/{$lead->id}", 'public');

            $doc->fill([
                'original_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'mime' => $file->getMimeType(),
                'size' => $file->getSize(),
                // A replaced file goes back into the review queue.
                'status' => LeadDocument::STATUS_SUBMITTED,
            ]);
            $replacedFile = true;
        }

        if ($request->filled('checklist_key')) {
            $doc->checklist_key = $request->input('checklist_key');
        }

        $doc->save();

        if ($replacedFile) {
            $this->notifyDocumentSubmitted($lead, $doc, 'replaced');
        }

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

        // Approved docs are locked; the lead can still remove a pending /
        // under-review / rejected one.
        if ($doc->status === LeadDocument::STATUS_APPROVED) {
            return back()->with('error', 'This document has been approved and can no longer be deleted.');
        }

        if ($doc->file_path) {
            try {
                Storage::disk('public')->delete($doc->file_path);
            } catch (\Throwable $e) { /* noop */
            }
        }
        $doc->delete();

        return redirect()
            ->route('track.lookup', ['code' => $lead->tracking_code])
            ->with('success', 'Document removed.');
    }

    // ─── helpers ────────────────────────────────────────────────────────

    /**
     * Notify staff that a lead submitted (or replaced) a document. Goes to
     * the lead's assigned staff member; if none is assigned, falls back to
     * admin-tier users so a submission is never dropped on the floor. The
     * lead is never notified here.
     */
    private function notifyDocumentSubmitted(Lead $lead, LeadDocument $document, string $context): void
    {
        $recipients = $this->staffRecipients($lead);
        if ($recipients->isEmpty()) {
            return;
        }

        Notification::send($recipients, new DocumentSubmittedForReview($lead, $document, $context));
    }

    /**
     * Who hears about a lead's tracker activity: their assigned staff
     * member, or admin-tier users as a fallback when unassigned.
     *
     * @return \Illuminate\Support\Collection<int, User>
     */
    private function staffRecipients(Lead $lead): \Illuminate\Support\Collection
    {
        $recipients = $lead->assignee
            ? collect([$lead->assignee])
            : User::whereIn('role', [User::ROLE_ADMIN, User::ROLE_SUPER_ADMIN])->get();

        // Immigration cases always loop in the immigration team — even for
        // public tracker uploads — so the department hears about activity on
        // their own cases regardless of who (if anyone) is assigned.
        if ($lead->is_immigration_case) {
            $immigration = User::whereIn('role', array_merge(['immigration'], User::IMMIGRATION_ROLES))->get();
            $recipients = $recipients->merge($immigration)->unique('id')->values();
        }

        return $recipients;
    }

    private function resolveLead(string $code): ?Lead
    {
        return Lead::where('tracking_code', strtoupper(trim($code)))->first();
    }

    /**
     * Stamp last_seen_at on every visit and write a debounced activity-log
     * entry (at most once per 15 min) so the audit trail doesn't flood on a
     * page that polls/refreshes. The tracking_code is the "actor" since
     * there's no logged-in user; no sensitive lead data is logged.
     */
    private function recordVisit(Request $request, Lead $lead): void
    {
        $shouldLog = is_null($lead->last_seen_at)
            || $lead->last_seen_at->lt(now()->subMinutes(15));

        // saveQuietly so the last_seen_at write doesn't itself spam the
        // LogsActivity 'lead.updated' trail.
        $lead->forceFill(['last_seen_at' => now()])->saveQuietly();

        if (! $shouldLog) {
            return;
        }

        ActivityLog::record('lead.tracker_view', [
            'actor_name' => $lead->tracking_code,
            'actor_role' => 'tracker',
            'portal' => 'public',
            'entity_type' => Lead::class,
            'entity_id' => $lead->id,
            'description' => "Tracker viewed for {$lead->tracking_code}",
            'metadata' => [
                'user_agent' => Str::limit((string) $request->userAgent(), 255, ''),
            ],
        ]);
    }

    private function publicLeadShape(Lead $lead): array
    {
        return [
            'tracking_code' => $lead->tracking_code,
            'first_name' => $lead->first_name,
            'last_name' => $lead->last_name,
            'stage' => $lead->stage,
            'created_at' => optional($lead->created_at)?->toIso8601String(),
            'is_student' => (bool) $lead->is_student,
            'is_immigration_case' => (bool) $lead->is_immigration_case,
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
        // Files uploaded against a checklist item staff have hidden from the
        // tracker are excluded here too, so hiding an item also hides any
        // file already attached to it.
        $hidden = is_array($lead->hidden_track_documents) ? $lead->hidden_track_documents : [];

        return $lead->documents()
            ->orderByDesc('created_at')
            ->get()
            ->reject(fn (LeadDocument $d) => $d->checklist_key && in_array($d->checklist_key, $hidden, true))
            ->map(fn (LeadDocument $d) => [
                'id' => $d->id,
                'original_name' => $d->original_name,
                'checklist_key' => $d->checklist_key,
                'size' => $d->size,
                'mime' => $d->mime,
                'status' => $d->status,
                'source' => $d->source,
                'created_at' => $d->created_at?->toIso8601String(),
                // Public storage URL — drives the gallery thumbnail click
                // and the inline image preview for jpeg/png uploads.
                'url' => $d->file_path ? Storage::disk('public')->url($d->file_path) : null,
                'is_image' => str_starts_with((string) $d->mime, 'image/'),
                // Lead can only edit / delete while the doc is still
                // pending review. Once a staff member touches it the
                // controller rejects the change anyway, but we surface the
                // flag so the UI can hide the action buttons cleanly.
                'is_editable' => $d->status === LeadDocument::STATUS_SUBMITTED,
            ])
            ->values()
            ->all();
    }

    /**
     * Build 11.D Phase 3 — Agreements awaiting (or already done) on the
     * tracker. Drafts / voided / expired never surface here; signed ones
     * show with a "view confirmation" link so the client can re-read what
     * they signed without bouncing through their inbox.
     */
    private function publicAgreements(Lead $lead, string $code): array
    {
        return $lead->agreements()
            ->whereIn('status', [
                \App\Models\Agreement::STATUS_SENT,
                \App\Models\Agreement::STATUS_VIEWED,
                \App\Models\Agreement::STATUS_SIGNED,
            ])
            ->whereNotNull('tracker_signing_token')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (\App\Models\Agreement $a) => [
                'id' => $a->id,
                'title' => $a->title,
                'status' => $a->status,
                'sent_at' => $a->sent_at?->toIso8601String(),
                'signed_at' => $a->signed_at?->toIso8601String(),
                'sign_url' => "/track/{$code}/agreements/{$a->tracker_signing_token}/sign",
                'view_url' => "/track/{$code}/agreements/{$a->tracker_signing_token}/view",
                'signed_url' => "/track/{$code}/agreements/{$a->tracker_signing_token}/signed",
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
    /**
     * Resolve the visa-type catalogue entry the lead is on and decorate
     * each of its checklist items with a per-item status (submitted /
     * approved / rejected / missing). Status is computed from the lead's
     * own LeadDocument rows, matched by `checklist_key`.
     *
     * Returns null when the lead has no `inz_visa_type` set OR the visa
     * type can't be located in the catalogue.
     */
    private function resolveVisa(Lead $lead): ?array
    {
        if (! $lead->inz_visa_type) {
            return null;
        }

        $visa = VisaType::query()
            ->where('name', $lead->inz_visa_type)
            ->orWhere('code', $lead->inz_visa_type)
            ->first();

        if (! $visa) {
            // Surface the bare visa name so the panel can still render
            // something useful even when the catalogue doesn't match.
            return [
                'name' => $lead->inz_visa_type,
                'short_description' => null,
                'checklist' => [],
                'totals' => ['required' => 0, 'submitted' => 0, 'approved' => 0],
            ];
        }

        // Group docs by checklist_key so we can decorate items in O(1).
        $docsByKey = $lead->documents()
            ->whereNotNull('checklist_key')
            ->get()
            ->groupBy('checklist_key');

        $items = is_array($visa->checklist_items) ? $visa->checklist_items : [];

        // Drop any checklist items staff have hidden from the tracker for
        // this specific case.
        $hidden = is_array($lead->hidden_track_documents) ? $lead->hidden_track_documents : [];
        if (! empty($hidden)) {
            $items = collect($items)
                ->reject(fn ($it) => in_array($it['key'] ?? null, $hidden, true))
                ->values()
                ->all();
        }

        $decorated = collect($items)->map(function ($item) use ($docsByKey) {
            $key = $item['key'] ?? null;
            $docs = $key ? ($docsByKey->get($key) ?? collect()) : collect();

            // Status is whichever the "best" doc landed on:
            //   Approved > Submitted/UnderReview > Rejected > none.
            $status = 'missing';
            if ($docs->contains(fn ($d) => $d->status === LeadDocument::STATUS_APPROVED)) {
                $status = 'approved';
            } elseif ($docs->contains(fn ($d) => in_array($d->status, [LeadDocument::STATUS_SUBMITTED, LeadDocument::STATUS_UNDER_REVIEW]))) {
                $status = 'submitted';
            } elseif ($docs->contains(fn ($d) => $d->status === LeadDocument::STATUS_REJECTED)) {
                $status = 'rejected';
            }

            return [
                'key' => $key,
                'label' => $item['label'] ?? '',
                'hint' => $item['hint'] ?? null,
                'required' => ($item['required'] ?? true) ? true : false,
                'status' => $status,
                'count' => $docs->count(),
            ];
        })->all();

        $requiredCount = collect($decorated)->where('required', true)->count();
        $submittedCount = collect($decorated)
            ->where('required', true)
            ->whereIn('status', ['submitted', 'approved'])
            ->count();
        $approvedCount = collect($decorated)
            ->where('required', true)
            ->where('status', 'approved')
            ->count();

        return [
            'name' => $visa->name,
            'code' => $visa->code,
            'short_description' => $visa->short_description,
            'checklist' => $decorated,
            'totals' => [
                'required' => $requiredCount,
                'submitted' => $submittedCount,
                'approved' => $approvedCount,
            ],
        ];
    }

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
            ['key' => 'conversion',    'label' => 'Department Assigned', 'at' => $earliestConversion],
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
                'key' => $m['key'],
                'label' => $m['label'],
                'status' => $status,
                'at' => $m['at'] ? Carbon::parse($m['at'])->toIso8601String() : null,
            ];
        }

        return $journey;
    }

    /**
     * 12-step "My Visa Application Journey" used for immigration cases.
     * Each entry mirrors the standard journey shape (key/label/status/at)
     * with two extras:
     *   - description: per-step copy displayed under the label
     *   - alternative: true when the step is an outcome branch (Decline)
     *     so the frontend can draw the connecting line dashed.
     *
     * The status of each step is computed from explicit lead columns +
     * the lead's current `immigration_stage`. The 11 standard steps are
     * always returned in order; the 12th "Application declined" step is
     * appended only when the case has been declined.
     */
    private function buildImmigrationJourney(Lead $lead): array
    {
        $docs = $lead->documents;
        $stage = $lead->immigration_stage; // one of Lead::IMMIGRATION_STAGES
        $hasDocs = $docs->isNotEmpty();
        $hasUnderReview = $docs->whereIn('status', [LeadDocument::STATUS_SUBMITTED, LeadDocument::STATUS_UNDER_REVIEW])->isNotEmpty();
        $hasApprovedDoc = $docs->where('status', LeadDocument::STATUS_APPROVED)->isNotEmpty();

        // Stage hierarchy — anything at or past `Endorsed` counts as "doc
        // review done", anything at or past `Visa Lodged` counts as
        // "application lodged", etc. Decline / Approved Visa are
        // terminal markers.
        $stageRank = [
            'Endorsed' => 1,
            'Visa Lodged' => 2,
            'Request for Information' => 3,
            'Approved in Principle' => 4,
            'Approved Visa' => 5,
            'Decline Visa' => -1, // outcome branch
        ];
        $rank = $stageRank[$stage] ?? 0;
        $declined = $stage === 'Decline Visa';

        // Step definitions — `done` is whatever proves the step happened,
        // `at` is the best timestamp we can attach for display.
        $steps = [
            [
                'key' => 'initial_consultation',
                'label' => 'Initial consultation',
                'description' => 'I meet my adviser to check if I\'m eligible and explore my options.',
                'done' => (bool) $lead->date_of_first_contact,
                'at' => optional($lead->date_of_first_contact)?->toDateTimeString(),
            ],
            [
                'key' => 'referred_to_adviser',
                'label' => 'Referred to my adviser',
                'description' => 'My case is passed to a Licensed Immigration Adviser to look after it.',
                'done' => (bool) $lead->date_of_engagement || (bool) $lead->immigration_converted_at,
                'at' => optional($lead->date_of_engagement)?->toDateTimeString()
                                ?? optional($lead->immigration_converted_at)?->toDateTimeString(),
            ],
            [
                'key' => 'engaged_adviser',
                'label' => 'Engaged my adviser',
                'description' => 'I sign the service agreement and my adviser formally takes on my case.',
                'done' => (bool) $lead->services_agreement_signed_at,
                'at' => optional($lead->services_agreement_signed_at)?->toDateTimeString(),
            ],
            [
                'key' => 'gathering_documents',
                'label' => 'Gathering my documents',
                'description' => 'I collect and send through the documents on my checklist.',
                'done' => $hasDocs,
                'at' => optional($docs->sortBy('created_at')->first()?->created_at)?->toDateTimeString(),
            ],
            [
                'key' => 'documentation_review',
                'label' => 'Documentation under review',
                'description' => 'My adviser checks everything is correct, complete and valid.',
                'done' => $hasUnderReview || $hasApprovedDoc || $rank >= 1,
                'at' => optional(
                    $docs->whereIn('status', [LeadDocument::STATUS_APPROVED, LeadDocument::STATUS_UNDER_REVIEW])
                        ->sortBy('created_at')->first()?->created_at
                )?->toDateTimeString(),
            ],
            [
                'key' => 'application_prepared',
                'label' => 'Application prepared',
                'description' => 'My adviser drafts my application, and we do a final check before lodging.',
                'done' => $rank >= 1,
                'at' => null,
            ],
            [
                'key' => 'application_lodged',
                'label' => 'Application lodged',
                'description' => 'My application is formally submitted to Immigration New Zealand.',
                'done' => (bool) $lead->inz_lodged_at || $rank >= 2,
                'at' => optional($lead->inz_lodged_at)?->toDateTimeString(),
            ],
            [
                'key' => 'further_info_requested',
                'label' => 'Further information requested',
                'description' => 'Immigration NZ asks for more details, and my adviser helps me respond.',
                // Treat this as "happened" only when the case currently is
                // or was previously at RFI (rank 3) or has moved past it.
                'done' => $rank >= 3,
                'at' => null,
                // Mark optional so we don't force every applicant through
                // a step they may never trigger.
                'optional' => true,
            ],
            [
                'key' => 'approved_in_principle',
                'label' => 'Approved in principle',
                'description' => 'My visa is approved, pending final steps like payment or medicals.',
                'done' => $rank >= 4,
                'at' => null,
            ],
            [
                'key' => 'visa_approved',
                'label' => 'Visa approved',
                'description' => 'Immigration New Zealand grants my visa.',
                'done' => $rank >= 5,
                'at' => optional($lead->inz_decision_at)?->toDateTimeString(),
            ],
            [
                'key' => 'visa_issued',
                'label' => 'Visa issued & settling in',
                'description' => 'I receive my visa and prepare to travel, arrive and settle in.',
                // We don't track "issued" separately yet; treat as
                // visa_approved + complete (so the lead sees it as
                // pending until staff stamp a decision).
                'done' => $rank >= 5 && (bool) $lead->inz_decision_at,
                'at' => optional($lead->inz_decision_at)?->toDateTimeString(),
            ],
        ];

        // Walk the list and tag completed / current / pending. Optional
        // steps don't promote themselves to "current" — they stay
        // pending until evidence appears.
        $foundCurrent = false;
        $journey = [];
        foreach ($steps as $s) {
            if (! empty($s['done'])) {
                $status = 'completed';
            } elseif (! $foundCurrent && empty($s['optional'])) {
                $status = 'current';
                $foundCurrent = true;
            } else {
                $status = 'pending';
            }

            $journey[] = [
                'key' => $s['key'],
                'label' => $s['label'],
                'description' => $s['description'],
                'status' => $status,
                'at' => $s['at'] ? Carbon::parse($s['at'])->toIso8601String() : null,
            ];
        }

        // Declined outcome — append a 12th alternative-branch step. The
        // frontend renders this with a dashed connecting line so it reads
        // as a branch rather than a continuation.
        if ($declined) {
            // Demote any step we'd already tagged "current" because the
            // outcome decided the case.
            $journey = array_map(function ($s) {
                if ($s['status'] === 'current') {
                    $s['status'] = 'pending';
                }

                return $s;
            }, $journey);

            $journey[] = [
                'key' => 'application_declined',
                'label' => 'Application declined',
                'description' => 'My application wasn\'t successful; my adviser tells me through next steps.',
                'status' => 'completed',
                'at' => optional($lead->inz_decision_at)?->toIso8601String(),
                'alternative' => true,
            ];
        }

        return $journey;
    }
}
