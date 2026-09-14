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
        // English Proficiency (IELTS/PTE) agreements.
        'english_review' => 'English Review',
        'pte_exam' => 'PTE Examination Fee',
        'english_package' => 'English Review & Exam (Package)',
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
            'english_engagement' => 'English — Offshore (Philippines)',
            'english_offshore' => 'English — Offshore',
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
        // English (IELTS/PTE) agreements edit their own fee fields.
        $englishFee = static::posInt($overrides['english_fee'] ?? null);
        $pteFee = static::posInt($overrides['pte_fee'] ?? null);

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
            // English — Offshore (Philippines): English Review + PTE exam fee.
            'english_engagement' => [
                $item('english_review', $englishFee ?? 14500),
                $item('pte_exam', $pteFee ?? 240),
            ],
            // English — Offshore: single NZD package fee.
            'english_offshore' => [$item('english_package', $englishFee ?? 550)],
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
        // Everything lives INSIDE consultancy_review (a single JSON column — the
        // leads row-size limit forbids a second one).
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

        $lead->consultancy_review = [
            'status' => 'pending',
            'submitted_at' => now()->toIso8601String(),
            'submitted_by' => $submittedBy,
            'scenario' => $type,
            'scenario_label' => static::scenarioLabel($type),
            'applicant_mode' => $overrides['applicant_mode'] ?? 'single',
            'currency' => $overrides['currency'] ?? 'php',
            'item_keys' => array_map(fn ($it) => $it['key'], $items),
            'items' => $meta,
            // Everything needed to render the preview and generate the final PDF
            // on approval (fees, bank details, applicant mode, currency). No PDF
            // exists until the agreement is approved.
            'overrides' => $overrides,
            'emailed' => false,
        ];
        $lead->save();
    }

    /**
     * Rebuild the fee/override array for rendering — the stored submit overrides
     * (bank details, mode, currency) with the reviewer's edited item amounts
     * mapped back onto the fee keys.
     */
    public static function overridesForGeneration(array $review): array
    {
        $out = is_array($review['overrides'] ?? null) ? $review['overrides'] : [];
        $items = is_array($review['items'] ?? null) ? $review['items'] : [];

        $amt = fn ($key) => isset($items[$key]['amount']) && $items[$key]['amount'] !== null ? (int) $items[$key]['amount'] : null;

        if (($v = $amt('school_enrolment')) !== null) {
            $out['school_enrolment_fee'] = $v;
        }
        if (($v = $amt('english_proficiency')) !== null) {
            $out['english_proficiency_fee'] = $v;
        }
        // Offshore's single package fee rides the school_enrolment_fee override.
        if (($v = $amt('package')) !== null) {
            $out['school_enrolment_fee'] = $v;
        }
        // English agreements: map the reviewer's edited amounts back to the
        // english_fee / pte_fee overrides the English generators read.
        if (($v = $amt('english_review')) !== null) {
            $out['english_fee'] = $v;
        }
        if (($v = $amt('english_package')) !== null) {
            $out['english_fee'] = $v;
        }
        if (($v = $amt('pte_exam')) !== null) {
            $out['pte_fee'] = $v;
        }

        return $out;
    }

    /** Map the stored agreement type → [view, payload] for an HTML preview. */
    public static function previewPayload(\App\Services\AgreementGenerator $g, Lead $lead, ?string $type, array $overrides): array
    {
        if ($type === 'consultancy_onshore') {
            $payload = $g->buildOnshoreEngagementPayload($lead, $overrides);
            $view = 'agreements.onshore-engagement';
        } elseif ($type === 'english_engagement') {
            $payload = $g->buildEnglishEngagementPayload($lead, $overrides['currency'] ?? 'php', $overrides);
            $view = 'agreements.engagement-english';
        } elseif ($type === 'english_offshore') {
            $payload = $g->buildEnglishOffshorePayload($lead, $overrides['currency'] ?? 'nzd', $overrides);
            $view = 'agreements.engagement-english-offshore';
        } elseif ($type === 'consultancy_offshore' || $type === 'consultancy_offshore_zero') {
            $payload = $g->buildOffshorePayload($lead, $type === 'consultancy_offshore_zero' ? array_merge($overrides, ['zero_fees' => true]) : $overrides);
            $view = 'agreements.consultancy-offshore';
        } else {
            [$payload] = $g->buildConsultancyPayload($lead, static::scenarioKey($type), $overrides);
            $view = 'agreements.consultancy';
        }
        $payload['preview'] = true; // in-flow logo, no PDF-only running footer

        return [$view, $payload];
    }

    /** Generate + attach the final PDF for an approved agreement. */
    public static function generatePdf(\App\Services\AgreementGenerator $g, Lead $lead, ?string $type, array $overrides): void
    {
        if ($type === 'consultancy_onshore') {
            $g->onshoreEngagement($lead, $overrides);
        } elseif ($type === 'english_engagement') {
            $g->englishEngagement($lead, $overrides['currency'] ?? 'php', $overrides);
        } elseif ($type === 'english_offshore') {
            $g->englishOffshore($lead, $overrides['currency'] ?? 'nzd', $overrides);
        } elseif ($type === 'consultancy_offshore_zero') {
            $g->consultancyOffshore($lead, array_merge($overrides, ['zero_fees' => true]));
        } elseif ($type === 'consultancy_offshore') {
            $g->consultancyOffshore($lead, $overrides);
        } else {
            $g->consultancy($lead, static::scenarioKey($type), $overrides);
        }
    }

    /** Stored agreement type → AgreementGenerator scenario key. */
    private static function scenarioKey(?string $type): string
    {
        return match ($type) {
            'consultancy_voucher_150' => 'voucher_150',
            'consultancy_std_100' => 'std_100',
            'consultancy_english_100' => 'english_100',
            default => 'std_150',
        };
    }

    private static function posInt($val): ?int
    {
        return ($val !== null && $val !== '' && is_numeric($val) && (int) $val > 0) ? (int) $val : null;
    }
}
