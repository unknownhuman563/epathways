<?php

namespace App\Services;

use App\Models\Lead;

/**
 * Builds the fee line-items for a consultancy agreement and submits it into the
 * Consultancy Agreement Verification queue — the consultancy counterpart of the
 * proposal (Program) verification flow.
 *
 * Fee amounts aren't persisted structurally anywhere else (they're baked into
 * the generated PDF), so we snapshot them here at submit time so a reviewer can
 * confirm / edit each amount and mark it verified before the agreement is sent.
 */
class ConsultancyReviewService
{
    /** Human labels per fee-item key. */
    public const ITEM_LABELS = [
        'school_enrolment' => 'School Enrolment & Documentation',
        'english_proficiency' => 'English Proficiency',
        'inz_voucher' => 'INZ Visa Application Fee (voucher)',
        'package' => 'Package Fee',
    ];

    /** A short human label for the chosen agreement variant. */
    public static function scenarioLabel(string $type): string
    {
        return match ($type) {
            'consultancy_std_150' => 'Standard — 150,000',
            'consultancy_voucher_150' => 'With Voucher — 150,000 (incl. INZ visa fee)',
            'consultancy_std_100' => 'Standard — 100,000',
            'consultancy_english_100' => 'With English — 100,000',
            'consultancy_offshore' => 'Offshore',
            'consultancy_offshore_zero' => 'Offshore — Zero fees',
            'consultancy_onshore' => 'Onshore engagement (free)',
            default => 'Consultancy Agreement',
        };
    }

    /**
     * Ordered fee items for a given agreement type + fee overrides, as
     * [ ['key' => .., 'label' => .., 'amount' => int|null], … ].
     */
    public static function feeItems(string $type, array $overrides = []): array
    {
        $school = static::posInt($overrides['school_enrolment_fee'] ?? null);
        $english = static::posInt($overrides['english_proficiency_fee'] ?? null);

        $item = fn (string $key, ?int $amount) => [
            'key' => $key,
            'label' => static::ITEM_LABELS[$key] ?? $key,
            'amount' => $amount,
        ];

        return match ($type) {
            'consultancy_std_150' => [$item('school_enrolment', $school ?? 150000)],
            'consultancy_voucher_150' => [
                $item('school_enrolment', $school ?? 150000),
                $item('inz_voucher', 30600),
            ],
            'consultancy_std_100' => [$item('school_enrolment', $school ?? 100000)],
            'consultancy_english_100' => [
                $item('school_enrolment', $school ?? 100000),
                $item('english_proficiency', $english ?? 14500),
            ],
            'consultancy_offshore' => [$item('package', $school ?? 3500)],
            'consultancy_offshore_zero' => [$item('package', $school ?? 0)],
            // Onshore engagement is free — no fee items, just an overall review.
            'consultancy_onshore' => [],
            default => [],
        };
    }

    /**
     * Snapshot the fee items onto the lead and move the consultancy agreement
     * into the verification queue as PENDING. Called when staff generate a
     * consultancy agreement (the client is not emailed until it's approved).
     */
    public static function submit(Lead $lead, string $type, array $overrides, ?int $submittedBy): void
    {
        $items = static::feeItems($type, $overrides);

        // Fresh per-item meta (amount + status + note thread), keyed by item key.
        $meta = [];
        foreach ($items as $it) {
            $meta[$it['key']] = [
                'label' => $it['label'],
                'amount' => $it['amount'],
                'status' => 'needs_check',
                'note' => null,
                'edited' => false,
                'notes' => [],
            ];
        }

        $lead->consultancy_meta = $meta ?: null;
        $lead->consultancy_review = [
            'status' => 'pending',
            'submitted_at' => now()->toIso8601String(),
            'submitted_by' => $submittedBy,
            'scenario' => $type,
            'scenario_label' => static::scenarioLabel($type),
            'applicant_mode' => $overrides['applicant_mode'] ?? 'single',
            'currency' => $overrides['currency'] ?? 'php',
            'item_keys' => array_map(fn ($it) => $it['key'], $items),
            'emailed' => false,
        ];
        $lead->save();
    }

    private static function posInt($val): ?int
    {
        return ($val !== null && $val !== '' && is_numeric($val) && (int) $val > 0) ? (int) $val : null;
    }
}
