<?php

namespace App\Services\Immigration\Findings\Rules;

use App\Models\CaseStepState;
use App\Models\Lead;
use App\Services\Immigration\CaseStepService;
use App\Services\Immigration\Findings\FindingRule;
use App\Services\Immigration\Findings\RuleResult;
use App\Services\Immigration\ImmigrationBusinessClock;

/**
 * Step 14 — the weekly Friday status update (Build 12 phase 4.5). This is the
 * only client-facing repeating commitment in the process and the most likely to
 * draw a complaint if missed, so it gets its own recurring-cadence check.
 *
 * Fires only while the case is post-lodgement (step 13 done) and pre-decision
 * (step 16 not done), when no Friday update has been logged in the trailing
 * week. A "Friday update" is a completed attempt of step 14, so logging another
 * (re-open + complete, weekly) clears it. Single finding_key → the usual dedup
 * and auto-resolve; a fresh update resolves it, a new lapse re-opens it.
 */
class FridayUpdateOverdueRule implements FindingRule
{
    public function __construct(
        private CaseStepService $steps,
        private ImmigrationBusinessClock $clock,
    ) {}

    public function evaluate(Lead $lead): RuleResult
    {
        $states = $this->steps->currentStates($lead);
        if ($states->isEmpty()) {
            return RuleResult::empty(); // not on the chain
        }

        $lodged = $states->get('13');
        $decision = $states->get('16');

        // Only between lodgement and decision.
        if (! $lodged || $lodged->status !== CaseStepState::STATUS_DONE) {
            return RuleResult::empty();
        }
        if ($decision && $decision->status === CaseStepState::STATUS_DONE) {
            return RuleResult::empty();
        }

        // Latest logged Friday update = newest completed attempt of step 14.
        $lastUpdate = CaseStepState::where('lead_id', $lead->id)
            ->where('step_key', '14')
            ->where('status', CaseStepState::STATUS_DONE)
            ->max('completed_at');

        $sla = ['type' => 'recurring', 'every' => 'week'];
        if (! $this->clock->recurringOverdue($lastUpdate ? \Illuminate\Support\Carbon::parse($lastUpdate) : null, $sla)) {
            return RuleResult::empty();
        }

        return new RuleResult([[
            'finding_key' => 'friday_update_overdue',
            'category' => 'Follow-up',
            'severity' => 'check',
            'title' => 'Weekly client status update is overdue',
            'detail' => $lastUpdate
                ? 'No Friday update logged in the last week. This is a client-facing commitment.'
                : 'No Friday update has been logged since lodgement. This is a client-facing commitment.',
            'evidence' => array_filter([
                'step_key' => '14',
                'last_update_at' => $lastUpdate ? \Illuminate\Support\Carbon::parse($lastUpdate)->toIso8601String() : null,
            ], fn ($v) => $v !== null),
            'audience' => 'staff',
        ]]);
    }
}
