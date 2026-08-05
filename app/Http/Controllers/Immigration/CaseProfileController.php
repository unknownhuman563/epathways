<?php

namespace App\Http\Controllers\Immigration;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\CaseAuditView;
use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\LeadNote;
use App\Models\ResidentIntake;
use App\Models\StudentIntake;
use App\Models\User;
use App\Models\VisitorIntake;
use App\Models\WorkIntake;
use App\Services\Immigration\CaseChecklistService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

/**
 * Build 11.D — Case Profile.
 *
 * Purpose-built workspace for an immigration case. Distinct from the
 * sales/lead detail page (admin/LeadDetails.jsx) so the case workflow
 * isn't a lowest-common-denominator overlay on a sales lead view.
 *
 * Six tabs, one Inertia page:
 *   Assessment · Documents · Agreement · Communications · AI Health · Notes
 *
 * Access is admin + immigration only (mirrors the Build 10 case-analysis
 * gate at app/Http/Controllers/Api/AiCaseAnalysisController.php — same
 * sensitivity, same policy).
 *
 * Privacy Act 2020: every render writes a CaseAuditView row. This was a
 * specific finding in docs/audits/VISA_ASSESSMENT_CASE_DETAIL_AUDIT_2026-06-22.md
 * — intake detail pages currently leave no audit trail. This page closes
 * that gap for case views.
 */
class CaseProfileController extends Controller
{
    public function show(Lead $lead, CaseChecklistService $checklist)
    {
        $user = auth()->user();
        abort_unless($user instanceof User, 403);

        $this->ensureCanViewCases($user);

        // Hard 404 on non-cases. This endpoint is case-only; non-cases
        // continue to use LeadController::show via /admin/leads/{id} etc.
        abort_unless($lead->is_immigration_case, 404);

        $this->writeAuditView($lead, $user);

        [$intakeType, $intake] = $this->resolveIntake($lead);

        return Inertia::render('portal/immigration/CaseProfile', [
            'lead' => $this->serializeLead($lead),
            'intake' => $intake ? ['type' => $intakeType, 'data' => $intake] : null,
            'documents' => $this->loadDocuments($lead),
            // Build 11.D Phase 4 — checklist resolution delegated to
            // CaseChecklistService. `items` is the flat list (kept for
            // backward-compat with the existing table view); `grouped`
            // partitions the same items by category; `unstructured` covers
            // docs uploaded under a no-longer-matching key; `progress`
            // drives the "X of Y required approved" header.
            'checklist' => array_merge(
                $checklist->sourceFor($lead),
                ['items' => $checklist->withStatuses($lead)],
            ),
            'checklistGrouped' => $checklist->groupedByCategory($lead),
            'unstructuredDocuments' => $checklist->unstructuredDocuments($lead),
            'checklistProgress' => $checklist->progress($lead),
            'communications' => $this->loadCommunications($lead),
            'agreements' => $this->loadAgreements($lead),
            'notes' => $this->loadNotes($lead),
            'activity' => $this->loadActivity($lead),
            // Build 12 phase 3 — case-assist findings. The last STORED result
            // (never evaluated on page load), grouped for the AI Health tab.
            'findings' => $this->loadFindings($lead),
            // Build 12 phase 4.5 — the process chain (steps, owners, gates, SLA).
            'process' => $this->loadProcess($lead),
        ]);
    }

    /**
     * The last stored findings evaluation for the case (Build 12 phase 3).
     * Open findings only, worst severity first; plus the run's timestamp and
     * the required "couldn't verify" list. Never triggers an evaluation.
     *
     * @return array{items: array, evaluated_at: ?string, couldnt_verify: array}
     */
    private function loadFindings(Lead $lead): array
    {
        $order = ['blocking' => 0, 'check' => 1, 'info' => 2];

        $items = \App\Models\CaseFinding::query()
            ->where('lead_id', $lead->id)
            ->where('status', \App\Models\CaseFinding::STATUS_OPEN)
            ->get()
            ->sortBy(fn ($f) => [$order[$f->severity] ?? 9, $f->first_seen_at?->timestamp ?? 0])
            ->values()
            ->map(fn (\App\Models\CaseFinding $f) => [
                'id' => $f->id,
                'finding_key' => $f->finding_key,
                'category' => $f->category,
                'severity' => $f->severity,
                'title' => $f->title,
                'detail' => $f->detail,
                'evidence' => $f->evidence ?? [],
                'source' => $f->source,
                'audience' => $f->audience,
                'first_seen_at' => optional($f->first_seen_at)->toIso8601String(),
                'last_seen_at' => optional($f->last_seen_at)->toIso8601String(),
            ]);

        $run = \App\Models\CaseFindingRun::where('lead_id', $lead->id)->first();

        return [
            'items' => $items,
            'evaluated_at' => optional($run?->evaluated_at)->toIso8601String(),
            'couldnt_verify' => $run?->couldnt_verify ?? [],
        ];
    }

    /**
     * Dismiss a finding with a required reason (Build 12 phase 3). Persists —
     * a dismissed finding stays dismissed even if the rule fires again, so the
     * dismissal rate per finding_key is how the rules get tuned.
     */
    public function dismissFinding(Request $request, Lead $lead, \App\Models\CaseFinding $finding)
    {
        $user = auth()->user();
        abort_unless($user instanceof User, 403);
        $this->ensureCanViewCases($user);
        abort_unless($lead->is_immigration_case, 404);
        abort_unless($finding->lead_id === $lead->id, 404);

        $data = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $finding->update([
            'status' => \App\Models\CaseFinding::STATUS_DISMISSED,
            'dismiss_reason' => $data['reason'],
            // Scope the dismissal to the current situation — a later evaluation
            // with different stable evidence re-opens it.
            'dismissed_fingerprint' => \App\Models\CaseFinding::fingerprintFor($finding->evidence),
            'actioned_by' => $user->id,
            'actioned_at' => now(),
        ]);

        return back()->with('success', 'Finding dismissed.');
    }

    /**
     * Manually queue a re-evaluation (Build 12 phase 3). The panel still renders
     * the last stored result; this refreshes it off the request path.
     */
    public function reevaluateFindings(Request $request, Lead $lead)
    {
        $user = auth()->user();
        abort_unless($user instanceof User, 403);
        $this->ensureCanViewCases($user);
        abort_unless($lead->is_immigration_case, 404);

        \App\Jobs\EvaluateCaseFindings::dispatch($lead->id);

        return back()->with('success', 'Re-checking the case — findings will refresh shortly.');
    }

    // ── Process chain (Build 12 phase 4.5) ──────────────────────────────────

    /**
     * The case's step chain for the Process panel — each template step decorated
     * with its current (highest-attempt) state, owner, due/overdue, plus the
     * payment and partner-fork records. `started=false` when no chain exists yet.
     *
     * @return array<string, mixed>
     */
    private function loadProcess(Lead $lead): array
    {
        $states = app(\App\Services\Immigration\CaseStepService::class)->currentStates($lead);

        if ($states->isEmpty()) {
            return ['started' => false, 'steps' => [], 'payment' => null, 'partner' => null];
        }

        $owners = User::whereIn('id', $states->pluck('owner_user_id')->filter()->unique())
            ->get(['id', 'name', 'avatar_path'])->keyBy('id');

        $steps = \App\Models\CaseStepTemplate::chain()->map(function ($t) use ($states, $owners) {
            $st = $states->get($t->step_key);
            $owner = $st && $st->owner_user_id ? $owners->get($st->owner_user_id) : null;

            return [
                'step_key' => $t->step_key,
                'label' => $t->label,
                'owner_role' => $t->owner_role,
                'stage' => $t->stage,
                'gate' => $t->gate,
                'is_qc' => $t->is_qc,
                'channels_required' => $t->channels_required,
                'depends_on' => $t->depends_on ?? [],
                'status' => $st->status ?? 'pending',
                'attempt' => $st->attempt ?? 1,
                'due_at' => optional($st->due_at)->toIso8601String(),
                'overdue' => $st && $st->status === \App\Models\CaseStepState::STATUS_ACTIVE
                    && $st->due_at && $st->due_at->isPast(),
                'completed_at' => optional($st->completed_at)->toIso8601String(),
                'qc_result' => $st->qc_result,
                'reactivation_trigger' => $st->reactivation_trigger,
                'owner' => $owner ? ['id' => $owner->id, 'name' => $owner->name, 'avatar_url' => $owner->avatar_url] : null,
            ];
        })->values();

        $payment = \App\Models\CasePayment::where('lead_id', $lead->id)->latest('id')->first();
        $partner = \App\Models\CasePartnerRecommendation::where('lead_id', $lead->id)->latest('id')->first();

        return [
            'started' => true,
            'steps' => $steps,
            'payment' => $payment ? [
                'amount_expected' => (float) $payment->amount_expected,
                'amount_received' => (float) $payment->amount_received,
                'status' => $payment->status,
                'method' => $payment->method,
                'received_at' => optional($payment->received_at)->toDateString(),
            ] : null,
            'partner' => $partner ? [
                'recommended_main_applicant' => $partner->recommended_main_applicant,
                'recommendation_reason' => $partner->recommendation_reason,
                'client_choice' => $partner->client_choice,
                'choice_document_id' => $partner->choice_document_id,
                'resolved' => $partner->isResolved(),
            ] : null,
        ];
    }

    /** Start (instantiate) the step chain for a case. */
    public function startProcess(Request $request, Lead $lead)
    {
        $this->guardCase($lead);
        app(\App\Services\Immigration\CaseStepService::class)->instantiate($lead);

        return back()->with('success', 'Process tracking started.');
    }

    /**
     * Complete a step. QC steps carry a pass/fail result and 3-channel steps the
     * channels done — both procedural, so NO licence gate (QC is not advice).
     */
    public function completeStep(Request $request, Lead $lead, string $step)
    {
        $user = $this->guardCase($lead);

        $data = $request->validate([
            'qc_result' => ['nullable', \Illuminate\Validation\Rule::in(['pass', 'fail'])],
            'channels' => 'nullable|array',
        ]);

        app(\App\Services\Immigration\CaseStepService::class)->complete($lead, $step, $user, $data);
        \App\Jobs\EvaluateCaseFindings::dispatch($lead->id);

        return back()->with('success', "Step {$step} completed.");
    }

    /** Re-enter a completed step as a new attempt (RFI, rejected doc, manual). */
    public function reactivateStep(Request $request, Lead $lead, string $step)
    {
        $this->guardCase($lead);

        $data = $request->validate([
            'trigger' => ['required', \Illuminate\Validation\Rule::in(['rfi', 'doc_rejected', 'verdict_needs_something', 'manual'])],
            'reason' => 'nullable|string|max:500',
        ]);

        app(\App\Services\Immigration\CaseStepService::class)->reactivate($lead, $step, $data['trigger'], $data['reason'] ?? null);
        \App\Jobs\EvaluateCaseFindings::dispatch($lead->id);

        return back()->with('success', "Step {$step} re-opened ({$data['trigger']}).");
    }

    /** Record a payment against the case (§15.5) — status derived from amounts. */
    public function recordPayment(Request $request, Lead $lead)
    {
        $user = $this->guardCase($lead);

        $data = $request->validate([
            'amount_expected' => 'required|numeric|min:0',
            'amount_received' => 'required|numeric|min:0',
            'method' => 'nullable|string|max:40',
            'received_at' => 'nullable|date',
        ]);

        \App\Models\CasePayment::create([
            'lead_id' => $lead->id,
            'amount_expected' => $data['amount_expected'],
            'amount_received' => $data['amount_received'],
            'status' => \App\Models\CasePayment::deriveStatus((float) $data['amount_expected'], (float) $data['amount_received']),
            'method' => $data['method'] ?? null,
            'received_at' => $data['received_at'] ?? now(),
            'recorded_by' => $user->id,
        ]);

        \App\Jobs\EvaluateCaseFindings::dispatch($lead->id);

        return back()->with('success', 'Payment recorded.');
    }

    /**
     * Partner-visa fork (§15.6). Recommending the main applicant is ADVICE —
     * licence-gated. Recording the client's written choice is procedural.
     */
    public function partnerRecommendation(Request $request, Lead $lead)
    {
        $user = $this->guardCase($lead);

        $data = $request->validate([
            'recommended_main_applicant' => 'nullable|string|max:160',
            'recommendation_reason' => 'nullable|string|max:1000',
            'client_choice' => 'nullable|string|max:160',
            'choice_document_id' => 'nullable|integer|exists:lead_documents,id',
        ]);

        // The recommendation is advice — only a licensed adviser may author it.
        if (filled($data['recommended_main_applicant']) && ! $user->holdsCurrentLicence()) {
            return back()->withErrors(['error' => 'Only a licensed adviser may recommend the main applicant.']);
        }

        $rec = \App\Models\CasePartnerRecommendation::firstOrNew(['lead_id' => $lead->id]);
        $rec->fill(array_filter($data, fn ($v) => $v !== null));
        $rec->recorded_by = $user->id;
        $rec->decided_at = filled($data['client_choice']) ? now() : $rec->decided_at;
        $rec->save();

        // Once the client has chosen in writing, the fork (step 06a) is done —
        // completing it advances the chain past the gate at step 06.
        $svc = app(\App\Services\Immigration\CaseStepService::class);
        $forkState = $svc->currentStates($lead)->get('06a');
        if ($rec->isResolved() && $forkState && $forkState->status === \App\Models\CaseStepState::STATUS_ACTIVE) {
            $svc->complete($lead, '06a', $user);
        }

        return back()->with('success', 'Partner recommendation saved.');
    }

    /** Shared case guard for the process endpoints. */
    private function guardCase(Lead $lead): User
    {
        $user = auth()->user();
        abort_unless($user instanceof User, 403);
        $this->ensureCanViewCases($user);
        abort_unless($lead->is_immigration_case, 404);

        return $user;
    }

    /** POST /portal/immigration/cases/{lead}/personal — edit the applicant's
     *  personal details from the Case Profile "Personal" tab. */
    public function updatePersonal(Request $request, Lead $lead)
    {
        $user = auth()->user();
        abort_unless($user instanceof User, 403);
        $this->ensureCanViewCases($user);
        abort_unless($lead->is_immigration_case, 404);

        $validated = $request->validate([
            'first_name' => 'required|string|max:120',
            'middle_name' => 'nullable|string|max:120',
            'last_name' => 'nullable|string|max:120',
            'suffix' => 'nullable|string|max:20',
            'gender' => 'nullable|string|max:40',
            'marital_status' => 'nullable|string|max:40',
            'dob' => 'nullable|date',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:40',
            'citizenship' => 'nullable|string|max:120',
            'residence_country' => 'nullable|string|max:120',
            'passport_number' => 'nullable|string|max:60',
            'passport_expiry' => 'nullable|date',
        ]);

        $lead->update($validated);

        return back()->with('success', 'Personal details updated.');
    }

    /** Same policy as Build 10's case-analysis gate. */
    private function ensureCanViewCases(User $user): void
    {
        abort_unless(
            $user->isAdmin()
                || $user->role === 'immigration'
                || in_array($user->role, User::IMMIGRATION_ROLES, true),
            403,
            'Only immigration staff may open case profiles.'
        );
    }

    /**
     * Privacy Act 2020 — record every staff view of a case for the
     * case-audit log. Mirrors the LeadController::show write at
     * app/Http/Controllers/LeadController.php:644-657 but with the
     * 'case_profile' context so the two surfaces can be told apart in
     * the audit table.
     */
    private function writeAuditView(Lead $lead, User $user): void
    {
        try {
            CaseAuditView::create([
                'lead_id' => $lead->id,
                'viewer_id' => $user->id,
                'viewer_name' => $user->name,
                'viewer_role' => $user->role,
                'action' => 'view',
                'context' => 'case_profile',
                'ip' => request()->ip(),
                'viewed_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Case profile audit view write failed', [
                'lead_id' => $lead->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Cases have two origin paths (see audit Section 6):
     *   1. Sales-converted via LeadController::convertToCase — no intake row, returns [null, null]
     *   2. Assessment-converted via Portal\ImmigrationController::convertAssessmentToCase —
     *      a polymorphic Assessment row paired with one of resident/work/student/visitor
     *      intakes. Linked to the Lead via `leads.assessment_id` (stamped at
     *      conversion); older cases fall back to a name-aware email match.
     *
     * Returns [type, intakeArray] where type is 'resident'|'work'|'student'|'visitor'|null.
     */
    protected function resolveIntake(Lead $lead): array
    {
        $assessment = null;

        // 1. Authoritative link, stamped at conversion time — the case points
        //    at the EXACT assessment it came from.
        if ($lead->assessment_id) {
            $assessment = Assessment::whereNotNull('intakeable_type')->find($lead->assessment_id);
        }

        $wantLast = strtolower(trim((string) $lead->last_name));
        $wantFirst = strtolower(trim((string) $lead->first_name));

        // 2. Legacy fallback (cases converted before the FK existed): match by
        //    email, but prefer the assessment whose intake name matches this
        //    lead — email alone is ambiguous when applicants share one.
        if (! $assessment && $lead->email) {
            $candidates = Assessment::where('applicant_email', $lead->email)
                ->whereNotNull('intakeable_type')
                ->latest('id')
                ->get();

            $assessment = $candidates->first(function ($a) use ($wantLast, $wantFirst) {
                $i = $a->intakeable;
                if (! $i) {
                    return false;
                }
                $iLast = strtolower(trim((string) ($i->last_name ?? $i->family_name ?? '')));
                $iFirst = strtolower(trim((string) ($i->first_name ?? '')));

                return $wantLast !== '' && $iLast === $wantLast && ($wantFirst === '' || $iFirst === $wantFirst);
            });
        }

        // 3. Name match — covers a case with no email (or no email match),
        //    e.g. a staff-created case. Uses the assessment's own applicant
        //    name and only links when the match is unambiguous.
        if (! $assessment && $wantFirst !== '' && $wantLast !== '') {
            $byName = Assessment::whereNotNull('intakeable_type')
                ->whereRaw('LOWER(TRIM(applicant_last_name)) = ?', [$wantLast])
                ->whereRaw('LOWER(TRIM(applicant_first_name)) = ?', [$wantFirst])
                ->latest('id')
                ->get();

            if ($byName->count() === 1) {
                $assessment = $byName->first();
            }
        }

        if (! $assessment) {
            return [null, null];
        }

        $intake = $assessment->intakeable;
        if (! $intake) {
            return [null, null];
        }

        $type = match ($intake::class) {
            ResidentIntake::class => 'resident',
            WorkIntake::class => 'work',
            StudentIntake::class => 'student',
            VisitorIntake::class => 'visitor',
            default => null,
        };

        if ($type === null) {
            return [null, null];
        }

        return [$type, array_merge($intake->toArray(), [
            'assessment_id' => $assessment->id,
            'assessment_status' => $assessment->status,
            'assessment_payment_status' => $assessment->payment_status,
            'assessment_booking_id' => $assessment->booking_id,
        ])];
    }

    private function serializeLead(Lead $lead): array
    {
        $lead->loadMissing(['assignee:id,name,email,role', 'faceImage']);

        return [
            'id' => $lead->id,
            'lead_id' => $lead->lead_id,
            // Applicant's uploaded Face image — same profile picture the
            // cases list and the client's tracker show.
            'avatar_url' => $lead->faceImageUrl(),
            'first_name' => $lead->first_name,
            'middle_name' => $lead->middle_name,
            'last_name' => $lead->last_name,
            'suffix' => $lead->suffix,
            'gender' => $lead->gender,
            'marital_status' => $lead->marital_status,
            'email' => $lead->email,
            'phone' => $lead->phone,
            'dob' => optional($lead->dob)->format('Y-m-d'),
            'citizenship' => $lead->citizenship,
            'residence_country' => $lead->residence_country,
            'passport_number' => $lead->passport_number,
            'passport_expiry' => optional($lead->passport_expiry)->format('Y-m-d'),
            'tracking_code' => $lead->tracking_code,
            'status' => $lead->status,
            'stage' => $lead->stage,
            'immigration_stage' => $lead->immigration_stage,
            'inz_visa_type' => $lead->inz_visa_type,
            'inz_reference' => $lead->inz_reference,
            'inz_status' => $lead->inz_status,
            'inz_lodged_at' => $lead->inz_lodged_at,
            'inz_decision_at' => $lead->inz_decision_at,
            'is_immigration_case' => (bool) $lead->is_immigration_case,
            'immigration_converted_at' => $lead->immigration_converted_at,
            'immigration_converted_by' => $lead->immigration_converted_by,
            'source' => $lead->source,
            'assignee' => $lead->assignee,
            'is_assessment_converted' => $this->wasAssessmentConverted($lead),
        ];
    }

    /**
     * "Came from assessment" vs "came from sales". A sales-converted case has
     * no Assessment row at the lead's email; an assessment-converted case does.
     */
    private function wasAssessmentConverted(Lead $lead): bool
    {
        if ($lead->assessment_id) {
            return true;
        }
        if (! $lead->email) {
            return false;
        }

        return Assessment::where('applicant_email', $lead->email)->exists();
    }

    private function loadDocuments(Lead $lead): array
    {
        return LeadDocument::where('lead_id', $lead->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (LeadDocument $d) => [
                'id' => $d->id,
                'checklist_key' => $d->checklist_key,
                'original_name' => $d->original_name,
                'mime' => $d->mime,
                'size' => $d->size,
                'status' => $d->status,
                'source' => $d->source,
                'source_variant' => $d->source_variant,
                'note' => $d->note,
                'reviewed_at' => $d->reviewed_at,
                'created_at' => $d->created_at,
            ])
            ->all();
    }

    // (loadVisaChecklist was here in Phase 1; Phase 4 moved it into
    // App\Services\Immigration\CaseChecklistService so the resolution
    // logic is testable in isolation and reusable by the optional
    // refresh endpoint below.)

    private function loadCommunications(Lead $lead): array
    {
        if (! $lead->email) {
            return [];
        }

        return DB::table('message_logs')
            ->where(function ($q) use ($lead) {
                $q->where(function ($qq) use ($lead) {
                    $qq->where('recipient_type', 'lead')
                        ->where('recipient_id', $lead->id);
                })->orWhere('recipient_address', $lead->email);
            })
            ->orderByDesc('id')
            ->limit(50)
            ->get([
                'id', 'channel', 'subject', 'body', 'status',
                'recipient_address', 'sent_at', 'failed_at', 'created_at',
            ])
            ->map(fn ($row) => [
                'id' => $row->id,
                'channel' => $row->channel,
                'subject' => $row->subject,
                'snippet' => $this->snippet($row->body),
                'status' => $row->status,
                'recipient_address' => $row->recipient_address,
                'sent_at' => $row->sent_at,
                'failed_at' => $row->failed_at,
                'created_at' => $row->created_at,
            ])
            ->all();
    }

    private function snippet(?string $body): string
    {
        if (! $body) {
            return '';
        }
        $plain = trim(strip_tags($body));

        return mb_strlen($plain) > 160 ? mb_substr($plain, 0, 160).'…' : $plain;
    }

    /**
     * Build 11.D Phase 2 — Managed agreements for the case. Distinct from
     * any AgreementGenerator-created LeadDocument rows (those still surface
     * under the Documents tab via the existing checklist flow).
     */
    private function loadAgreements(Lead $lead): array
    {
        return $lead->agreements()
            ->with(['template:id,name,visa_type', 'generatedBy:id,name'])
            ->latest()
            ->get()
            ->map(fn (\App\Models\Agreement $a) => [
                'id' => $a->id,
                'title' => $a->title,
                'status' => $a->status,
                'template' => $a->template
                    ? ['id' => $a->template->id, 'name' => $a->template->name, 'visa_type' => $a->template->visa_type]
                    : null,
                'generated_by' => $a->generatedBy?->name,
                'sent_at' => $a->sent_at,
                'viewed_at' => $a->viewed_at,
                'signed_at' => $a->signed_at,
                'signer_name' => $a->signer_name,
                'signer_ip' => $a->signer_ip,
                'signer_user_agent' => $a->signer_user_agent,
                'has_pdf' => (bool) $a->pdf_path,
                'has_signed_pdf' => (bool) $a->signed_pdf_path,
                'tracker_signing_token' => $a->tracker_signing_token,
                'created_at' => $a->created_at,
            ])
            ->all();
    }

    private function loadNotes(Lead $lead): array
    {
        return LeadNote::where('lead_id', $lead->id)
            ->orderByDesc('pinned')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn (LeadNote $n) => [
                'id' => $n->id,
                'body' => $n->body,
                'pinned' => (bool) ($n->pinned ?? false),
                'author' => $n->author_name ?? null,
                'created_at' => $n->created_at,
            ])
            ->all();
    }

    private function loadActivity(Lead $lead): array
    {
        return \App\Models\ActivityLog::query()
            ->where('properties->subject_type', 'Lead')
            ->where('properties->subject_id', $lead->id)
            ->latest()
            ->limit(40)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'action' => $log->action,
                'description' => $log->description,
                'actor_name' => $log->actor_name ?: 'System',
                'actor_role' => $log->actor_role ?: 'public',
                'created_at' => $log->created_at,
            ])
            ->all();
    }
}
