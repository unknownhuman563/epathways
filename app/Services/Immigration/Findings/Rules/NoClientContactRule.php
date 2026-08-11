<?php

namespace App\Services\Immigration\Findings\Rules;

use App\Models\Lead;
use App\Services\Immigration\Findings\FindingRule;
use App\Services\Immigration\Findings\RuleResult;

/**
 * The case has had no recorded staff activity for longer than the configured
 * window — a proxy for "nobody has moved this in a while". Uses last_activity_at
 * (the same stamp the custody staleness colour reads), falling back to the
 * creation date for cases never touched.
 */
class NoClientContactRule implements FindingRule
{
    public function evaluate(Lead $lead): RuleResult
    {
        $days = (int) config('immigration.findings.no_contact_days', 14);
        $lastTouch = $lead->last_activity_at ?: $lead->created_at;

        if (! $lastTouch || $lastTouch->isAfter(now()->subDays($days))) {
            return RuleResult::empty();
        }

        $idle = (int) $lastTouch->diffInDays(now());

        return new RuleResult([[
            'finding_key' => 'no_contact',
            'category' => 'Follow-up',
            'severity' => 'check',
            'title' => "No activity on this case for {$idle} days",
            'detail' => 'No recorded staff activity in the window — check the client isn\'t waiting on you.',
            'evidence' => ['last_activity_at' => $lastTouch->toIso8601String()],
            'audience' => 'staff',
        ]]);
    }
}
