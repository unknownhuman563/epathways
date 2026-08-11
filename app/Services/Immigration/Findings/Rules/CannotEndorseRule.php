<?php

namespace App\Services\Immigration\Findings\Rules;

use App\Models\CaseAttestation;
use App\Models\Lead;
use App\Services\Immigration\Findings\FindingRule;
use App\Services\Immigration\Findings\RuleResult;

/**
 * Build 12 phase 5 — surfaces the block from a `cannot_endorse` verdict. Kept as
 * a rule (rather than a one-off finding written by the verdict) so it inherits
 * the engine's dedup and auto-resolve: it holds while the current verdict is
 * cannot_endorse and clears itself the moment a superseding verdict is recorded.
 */
class CannotEndorseRule implements FindingRule
{
    public function evaluate(Lead $lead): RuleResult
    {
        $verdict = CaseAttestation::currentVerdict($lead->id);

        if (! $verdict || $verdict->verdict !== CaseAttestation::VERDICT_CANNOT_ENDORSE) {
            return RuleResult::empty();
        }

        return new RuleResult([[
            'finding_key' => 'cannot_endorse',
            'category' => 'Verdict',
            'severity' => 'blocking',
            'title' => 'Adviser cannot endorse this case',
            'detail' => $verdict->reason ?: 'The licensed adviser has recorded a cannot-endorse verdict. The case holds until a new verdict is given.',
            'evidence' => ['attestation_id' => $verdict->id, 'adviser_id' => $verdict->adviser_id],
            'audience' => 'both',
        ]]);
    }
}
