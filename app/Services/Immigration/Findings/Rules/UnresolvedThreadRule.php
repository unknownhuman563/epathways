<?php

namespace App\Services\Immigration\Findings\Rules;

use App\Models\Lead;
use App\Services\Immigration\Findings\FindingRule;
use App\Services\Immigration\Findings\RuleResult;

/**
 * An unresolved thread that requires an answer. Anchored, resolvable threads
 * arrive in phase 6 — until then there's no data to read, so this reports that
 * it couldn't check rather than staying silent. Wire the real check when
 * case_threads exists.
 */
class UnresolvedThreadRule implements FindingRule
{
    public function evaluate(Lead $lead): RuleResult
    {
        return RuleResult::couldntVerify('Case threads aren\'t built yet (phase 6) — unanswered questions on the case can\'t be flagged.');
    }
}
