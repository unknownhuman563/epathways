<?php

namespace App\Services\Immigration;

use App\Models\CasePartnerRecommendation;
use App\Models\CaseStepState;
use App\Models\CaseStepTemplate;
use App\Models\Lead;
use App\Models\User;
use App\Models\VisaType;
use App\Notifications\CaseHandedOff;
use Illuminate\Support\Collection;

/**
 * Build 12 phase 4.5 — the process-chain engine.
 *
 * Instantiates the 16-step chain per case, advances it along the depends_on DAG
 * (so step 11 runs in parallel with 09/10 and 12 waits on both), computes SLA
 * due-times through ImmigrationBusinessClock, re-enters via attempts (RFI,
 * rejected doc, needs_something), derives the coarse immigration_stage from the
 * furthest step (the chain is the single authoritative writer), and — per
 * §15.8 amendment A — notifies on any custody move exactly like an explicit
 * Phase 2 handoff.
 *
 * QC results live on the step state (qc_result); they are procedural, never
 * routed through AdviceBearingPolicy. Advice-bearing sign-offs are Phase 5.
 */
class CaseStepService
{
    public function __construct(private ImmigrationBusinessClock $clock) {}

    /** Build the chain for a case that doesn't have one yet (idempotent). */
    public function instantiate(Lead $lead): void
    {
        if (CaseStepState::where('lead_id', $lead->id)->exists()) {
            return;
        }

        foreach (CaseStepTemplate::chain() as $t) {
            CaseStepState::create([
                'lead_id' => $lead->id,
                'step_key' => $t->step_key,
                'attempt' => 1,
                'status' => $this->appliesTo($lead, $t->applies_when)
                    ? CaseStepState::STATUS_PENDING
                    : CaseStepState::STATUS_NOT_APPLICABLE,
            ]);
        }

        $this->advance($lead);
        $this->deriveStage($lead);
    }

    /** Current state of each step = its highest-attempt row, keyed by step_key. */
    public function currentStates(Lead $lead): Collection
    {
        return CaseStepState::where('lead_id', $lead->id)
            ->get()
            ->groupBy('step_key')
            ->map(fn (Collection $g) => $g->sortByDesc('attempt')->first());
    }

    /**
     * Activate every pending step whose dependencies are now satisfied. A step's
     * activation doesn't satisfy anything (only completion does), so one pass is
     * enough. Sets due_at, resolves the owner, and moves+notifies custody.
     */
    public function advance(Lead $lead): void
    {
        $states = $this->currentStates($lead);

        foreach (CaseStepTemplate::chain() as $t) {
            $st = $states->get($t->step_key);
            if (! $st || $st->status !== CaseStepState::STATUS_PENDING) {
                continue;
            }
            if (! $this->dependenciesSatisfied($t, $states)) {
                continue;
            }
            $this->activate($lead, $st, $t);
        }
    }

    private function activate(Lead $lead, CaseStepState $state, CaseStepTemplate $t): void
    {
        $ownerId = $this->resolveOwner($t->owner_role);

        $state->update([
            'status' => CaseStepState::STATUS_ACTIVE,
            'activated_at' => now(),
            'due_at' => $this->clock->dueFor($t->sla, now(), $this->slaContext($lead)),
            'owner_user_id' => $ownerId,
        ]);

        $this->maybeMoveCustody($lead, $ownerId, $t);

        // Reaching the lodgement gate re-surfaces every dismissed finding
        // (Build 12 phase 5): a finding dismissed as a convenience earlier must
        // not ride through to submission unseen. The adviser re-reviews them
        // before signing off. This is the fix for the phase-3 static-evidence
        // dismissal limitation.
        if ($t->step_key === '12') {
            $this->reopenDismissedFindings($lead);
        }
    }

    private function reopenDismissedFindings(Lead $lead): void
    {
        \App\Models\CaseFinding::where('lead_id', $lead->id)
            ->where('status', \App\Models\CaseFinding::STATUS_DISMISSED)
            ->update([
                'status' => \App\Models\CaseFinding::STATUS_OPEN,
                'dismiss_reason' => null,
                'dismissed_fingerprint' => null,
                'actioned_by' => null,
                'actioned_at' => null,
            ]);
    }

    /**
     * Complete the current attempt of a step. QC steps carry a qc_result;
     * 3-channel steps carry which channels were done. Then advance + re-derive
     * the stage.
     *
     * @param  array<string, mixed>  $opts  qc_result?, channels?, override_reason?
     */
    public function complete(Lead $lead, string $stepKey, ?User $by, array $opts = []): CaseStepState
    {
        $state = $this->currentStates($lead)->get($stepKey);
        abort_unless($state, 404, "Step {$stepKey} not found on this case.");

        // Step 12 (lodgement) completes only from an adviser lodgement sign-off,
        // never the mechanical upload (§15.2 / phase 5). VerdictService creates
        // the attestation first, then calls complete(); a direct "complete"
        // without it is refused.
        if ($stepKey === '12' && ! \App\Models\CaseAttestation::hasLodgementSignoff($lead->id)) {
            throw new \App\Exceptions\LodgementSignoffRequiredException;
        }

        $state->update([
            'status' => CaseStepState::STATUS_DONE,
            'completed_by' => $by?->id,
            'completed_at' => now(),
            'qc_result' => $opts['qc_result'] ?? $state->qc_result,
            'channels' => $opts['channels'] ?? $state->channels,
        ]);

        $this->advance($lead);
        $this->deriveStage($lead);

        return $state->fresh();
    }

    /**
     * Re-enter a step as a NEW attempt (RFI, rejected doc, needs_something).
     * Fresh due_at, so an RFI re-attempt isn't born already overdue, and a new
     * attempt number so its overdue finding doesn't collide with the resolved
     * finding from the first pass.
     */
    public function reactivate(Lead $lead, string $stepKey, string $trigger, ?string $reason = null): CaseStepState
    {
        $t = CaseStepTemplate::where('step_key', $stepKey)->firstOrFail();
        $maxAttempt = (int) CaseStepState::where('lead_id', $lead->id)->where('step_key', $stepKey)->max('attempt');

        $state = CaseStepState::create([
            'lead_id' => $lead->id,
            'step_key' => $stepKey,
            'attempt' => $maxAttempt + 1,
            'status' => CaseStepState::STATUS_ACTIVE,
            'activated_at' => now(),
            'due_at' => $this->clock->dueFor($t->sla, now(), $this->slaContext($lead)),
            'owner_user_id' => $this->resolveOwner($t->owner_role),
            'reactivation_trigger' => $trigger,
            'reactivation_reason' => $reason,
            'reactivated_from_attempt' => $maxAttempt,
        ]);

        $this->maybeMoveCustody($lead, $state->owner_user_id, $t);
        $this->deriveStage($lead);

        return $state;
    }

    // ── Dependencies / applicability ────────────────────────────────────────

    private function dependenciesSatisfied(CaseStepTemplate $t, Collection $states): bool
    {
        foreach ((array) $t->depends_on as $depKey) {
            $dep = $states->get($depKey);
            // A missing or unsatisfied dependency blocks. A not_applicable
            // dependency (e.g. the partner fork on a non-partner case) counts as
            // satisfied, so it blocks nothing.
            if (! $dep || ! $dep->isSatisfied()) {
                return false;
            }
        }

        return true;
    }

    /** @param  array<string, mixed>|null  $rule */
    private function appliesTo(Lead $lead, ?array $rule): bool
    {
        if (! $rule || empty($rule['type'])) {
            return true;
        }

        return match ($rule['type']) {
            'visa_is_partner' => str_contains(strtolower((string) $lead->inz_visa_type), 'partner'),
            // §14.5 default (unresolved): the case's ordinal among its adviser's
            // immigration cases, by creation order. No adviser → doesn't apply.
            'adviser_case_ordinal_lte' => $this->adviserCaseOrdinal($lead) !== null
                && $this->adviserCaseOrdinal($lead) <= (int) ($rule['n'] ?? 5),
            default => true,
        };
    }

    private function adviserCaseOrdinal(Lead $lead): ?int
    {
        if (! $lead->current_owner_id) {
            return null;
        }
        $ordinal = Lead::immigrationCase()
            ->where('current_owner_id', $lead->current_owner_id)
            ->where('created_at', '<=', $lead->created_at)
            ->count();

        return $ordinal ?: null;
    }

    // ── Owner resolution + custody ──────────────────────────────────────────

    /**
     * Resolve a template owner_role (a function) to a user. Minimal resolver:
     * a per-department config map role→user id (the explicit default), with
     * `adviser` falling back to the sole licensed adviser ONLY when exactly one
     * exists. Resolution is deterministic — never an arbitrary pick:
     *
     *   1. `config('immigration.step_owners.<role>')` if set → that user.
     *   2. role = adviser, exactly ONE current-licensed user → that user.
     *   3. otherwise → null (unassigned), and for the adviser role with MORE
     *      than one current licence, a warning is logged so the ambiguity is
     *      caught at assignment rather than silently resolved. Set a default
     *      adviser in config to auto-assign when several are licensed (e.g. a
     *      full-licence LIA and a provisional adviser both pass the gate).
     */
    private function resolveOwner(string $role): ?int
    {
        $map = (array) config('immigration.step_owners', []);
        if (! empty($map[$role])) {
            return (int) $map[$role];
        }

        if ($role === 'adviser') {
            $advisers = User::query()
                ->whereNotNull('iaa_licence_number')->where('iaa_licence_number', '!=', '')
                ->get(['id', 'iaa_licence_number', 'iaa_licence_expiry'])
                ->filter->holdsCurrentLicence();

            if ($advisers->count() === 1) {
                return (int) $advisers->first()->id;
            }

            if ($advisers->count() > 1) {
                \Illuminate\Support\Facades\Log::warning(
                    'Adviser step owner is ambiguous — several users hold a current licence and no default is configured. '
                    .'Set config(immigration.step_owners.adviser). Leaving the step unassigned rather than picking arbitrarily.',
                    ['licensed_user_ids' => $advisers->pluck('id')->all()],
                );
            }

            return null; // 0 or >1 → unassigned, never arbitrary
        }

        return null;
    }

    /**
     * Amendment A (§15.8): a step-driven custody move must notify the new owner
     * in-app + email, exactly like an explicit Phase 2 handoff — a silent move
     * would make the queue untrustworthy. Same-owner moves send nothing.
     */
    private function maybeMoveCustody(Lead $lead, ?int $newOwnerId, CaseStepTemplate $t): void
    {
        if (! $newOwnerId || $lead->current_owner_id === $newOwnerId) {
            return;
        }

        $lead->forceFill(['current_owner_id' => $newOwnerId, 'owner_since' => now()])->saveQuietly();

        User::find($newOwnerId)?->notify(new CaseHandedOff(
            $lead->fresh(),
            'Process chain',
            "Now yours: step {$t->step_key} · {$t->label}",
        ));
    }

    // ── Stage derivation (chain is authoritative) ───────────────────────────

    /**
     * Set immigration_stage from the furthest active/done step that carries a
     * stage. The chain is the single authoritative writer (§15.1), so this — and
     * the re-pointed manual control — are the only paths that touch the column.
     */
    public function deriveStage(Lead $lead): void
    {
        $states = $this->currentStates($lead);
        $stage = null;

        foreach (CaseStepTemplate::chain() as $t) {
            $st = $states->get($t->step_key);
            if ($st && $t->stage && in_array($st->status, [CaseStepState::STATUS_ACTIVE, CaseStepState::STATUS_DONE], true)) {
                $stage = $t->stage; // furthest wins (chain is ordered by position)
            }
        }

        if (! $stage || $lead->immigration_stage === $stage) {
            return;
        }

        // Forward-only: never drag a case backward. Instantiating a fresh chain
        // on a legacy case that's already (say) "Visa Lodged" must not reset it
        // to "For Assessment"; the chain catches up as steps complete. RFI is
        // deliberately ordered after lodgement in IMMIGRATION_STAGES, so a
        // genuine loop-back to it still counts as forward.
        $order = array_flip(Lead::IMMIGRATION_STAGES);
        $currentIdx = $order[$lead->immigration_stage] ?? -1;
        $nextIdx = $order[$stage] ?? -1;
        if ($lead->immigration_stage !== null && $nextIdx <= $currentIdx) {
            return;
        }

        $lead->immigration_stage = $stage;
        $lead->stage_updated_at = now();
        $lead->stage_updated_by = auth()->id();
        $lead->pushStageHistory('immigration', $stage, $lead->immigration_assignee);
        $lead->save();
    }

    /** Whether this case is on the process chain. */
    public function hasChain(Lead $lead): bool
    {
        return CaseStepState::where('lead_id', $lead->id)->exists();
    }

    /**
     * Re-pointed manual stage control (§15.1): a manual stage change on a
     * chained case becomes a forward JUMP — every applicable step up to and
     * including the furthest one mapped to the target stage is marked done (an
     * explicit, audited override of the normal per-step flow) — then the chain
     * advances and re-derives. The chain stays the single writer of the stage.
     * Returns false when the case has no chain (caller does the legacy write).
     */
    public function jumpToStage(Lead $lead, ?string $targetStage, ?User $by): bool
    {
        if (! $this->hasChain($lead) || ! $targetStage) {
            return false;
        }

        $target = CaseStepTemplate::where('stage', $targetStage)->orderByDesc('position')->first();
        if (! $target) {
            return false;
        }

        $states = $this->currentStates($lead);
        foreach (CaseStepTemplate::chain() as $t) {
            if ($t->position > $target->position) {
                break;
            }
            $st = $states->get($t->step_key);
            if (! $st || in_array($st->status, [CaseStepState::STATUS_DONE, CaseStepState::STATUS_NOT_APPLICABLE], true)) {
                continue;
            }
            $st->update(['status' => CaseStepState::STATUS_DONE, 'completed_by' => $by?->id, 'completed_at' => now()]);
        }

        $this->advance($lead);
        $this->deriveStage($lead);

        return true;
    }

    /** @return array<string, mixed> context for milestone SLAs (step 15). */
    private function slaContext(Lead $lead): array
    {
        $lodged = CaseStepState::where('lead_id', $lead->id)
            ->where('step_key', '13')
            ->where('status', CaseStepState::STATUS_DONE)
            ->orderByDesc('attempt')
            ->first();

        $processing = optional(VisaType::where('name', $lead->inz_visa_type)->first())->expected_processing_days;

        return ['lodged_at' => $lodged?->completed_at, 'processing_days' => $processing];
    }

    /** Whether the partner fork (if applicable) is still unresolved — blocks 06. */
    public function partnerForkPending(Lead $lead): bool
    {
        $forkState = $this->currentStates($lead)->get('06a');
        if (! $forkState || $forkState->status === CaseStepState::STATUS_NOT_APPLICABLE) {
            return false;
        }
        $rec = CasePartnerRecommendation::where('lead_id', $lead->id)->latest('id')->first();

        return ! ($rec && $rec->isResolved());
    }
}
