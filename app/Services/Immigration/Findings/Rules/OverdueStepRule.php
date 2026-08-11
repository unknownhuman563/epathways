<?php

namespace App\Services\Immigration\Findings\Rules;

use App\Models\CaseStepState;
use App\Models\CaseStepTemplate;
use App\Models\Lead;
use App\Services\Immigration\CaseStepService;
use App\Services\Immigration\Findings\FindingRule;
use App\Services\Immigration\Findings\RuleResult;

/**
 * Process-chain SLA breaches (Build 12 phase 4.5, §15.3). Reads the case's
 * current step attempts and flags any active step whose business-clock `due_at`
 * has passed. Gate steps (06, 12) breach as `blocking`, others as `check`.
 *
 * The finding key carries the attempt (`overdue_step:12:2`) so a re-entry (RFI)
 * doesn't collide with the resolved finding from the first pass — attempt 1's
 * `overdue_step:12:1` auto-resolved when that attempt completed. No model calls.
 */
class OverdueStepRule implements FindingRule
{
    public function __construct(private CaseStepService $steps) {}

    public function evaluate(Lead $lead): RuleResult
    {
        $states = $this->steps->currentStates($lead);
        if ($states->isEmpty()) {
            return RuleResult::empty(); // case not on the chain yet
        }

        $templates = CaseStepTemplate::chain()->keyBy('step_key');
        $findings = [];

        foreach ($states as $stepKey => $st) {
            if ($st->status !== CaseStepState::STATUS_ACTIVE || ! $st->due_at || ! $st->due_at->isPast()) {
                continue;
            }
            $t = $templates->get($stepKey);
            $overdueDays = (int) $st->due_at->diffInDays(now());

            $findings[] = [
                'finding_key' => "overdue_step:{$stepKey}:{$st->attempt}",
                'category' => 'Process',
                'severity' => ($t && $t->gate) ? 'blocking' : 'check',
                'title' => "Step {$stepKey} · ".($t->label ?? 'step').' — SLA overdue'.($overdueDays > 0 ? " by {$overdueDays}d" : ''),
                'detail' => 'Owner: '.($t->owner_role ?? '—').". Due {$st->due_at->toFormattedDateString()}.",
                'evidence' => array_filter([
                    'step_key' => $stepKey,
                    'attempt' => $st->attempt,
                    'due_at' => $st->due_at->toIso8601String(),
                    'owner_role' => $t->owner_role ?? null,
                ], fn ($v) => $v !== null),
                'audience' => 'staff',
            ];
        }

        return new RuleResult($findings);
    }
}
