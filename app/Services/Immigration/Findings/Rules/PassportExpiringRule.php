<?php

namespace App\Services\Immigration\Findings\Rules;

use App\Models\Lead;
use App\Services\Immigration\Findings\FindingRule;
use App\Services\Immigration\Findings\RuleResult;

/**
 * Passport expiring soon. The brief frames this against intended travel; that
 * date isn't captured structurally yet, so this rules-only version measures the
 * stored passport_expiry against "now + N months" and says so in couldn't-verify
 * when the expiry itself is absent.
 */
class PassportExpiringRule implements FindingRule
{
    public function evaluate(Lead $lead): RuleResult
    {
        $months = (int) config('immigration.findings.passport_expiry_months', 6);

        if (! $lead->passport_expiry) {
            return RuleResult::couldntVerify("Passport expiry date isn't on file — can't check whether it expires within {$months} months.");
        }

        $expiry = $lead->passport_expiry instanceof \Carbon\CarbonInterface
            ? $lead->passport_expiry
            : \Illuminate\Support\Carbon::parse($lead->passport_expiry);

        if ($expiry->isAfter(now()->addMonths($months))) {
            return RuleResult::empty();
        }

        $expired = $expiry->isPast();

        return new RuleResult([[
            'finding_key' => 'passport_expiring',
            'category' => 'Identity',
            'severity' => $expired ? 'blocking' : 'check',
            'title' => $expired
                ? "Passport expired {$expiry->toFormattedDateString()}"
                : "Passport expires {$expiry->toFormattedDateString()} — within {$months} months",
            'detail' => 'A valid passport is required for lodgement. Confirm renewal before proceeding.',
            'evidence' => array_filter([
                'passport_expiry' => $expiry->toDateString(),
                'passport_number' => $lead->passport_number,
            ], fn ($v) => $v !== null),
            'audience' => 'both',
        ]]);
    }
}
