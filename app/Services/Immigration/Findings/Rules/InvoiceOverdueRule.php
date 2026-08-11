<?php

namespace App\Services\Immigration\Findings\Rules;

use App\Models\CasePayment;
use App\Models\Lead;
use App\Models\LeadDocument;
use App\Services\Immigration\Findings\FindingRule;
use App\Services\Immigration\Findings\RuleResult;

/**
 * Invoice raised but not paid (Build 12 phase 4.5). Graduated off "couldn't
 * verify" now that case_payments exists (§15.5). An invoice document plus a
 * payment record that isn't `paid` (or no payment recorded at all), past a
 * short grace window, is flagged — payment gates lodgement (step 11 → 12).
 *
 * There's still no stored invoice due-date, so "past due" is approximated by a
 * grace window from the invoice's creation, not a real due date.
 */
class InvoiceOverdueRule implements FindingRule
{
    public function evaluate(Lead $lead): RuleResult
    {
        $invoice = LeadDocument::query()
            ->where('lead_id', $lead->id)
            ->where('source_variant', 'invoice')
            ->orderBy('created_at')
            ->first();

        if (! $invoice) {
            return RuleResult::empty(); // nothing invoiced
        }

        $payment = CasePayment::where('lead_id', $lead->id)->latest('id')->first();
        if ($payment && $payment->isPaid()) {
            return RuleResult::empty();
        }

        $graceDays = (int) config('immigration.findings.payment_overdue_days', 7);
        if ($invoice->created_at && $invoice->created_at->gt(now()->subDays($graceDays))) {
            return RuleResult::empty(); // still within grace
        }

        $status = $payment?->status ?? 'unrecorded';

        return new RuleResult([[
            'finding_key' => 'invoice_overdue',
            'category' => 'Billing',
            'severity' => 'check',
            'title' => "Invoice raised but payment is {$status} ({$graceDays}+ days)",
            'detail' => 'Payment hasn\'t cleared — follow up. Payment (step 11) gates lodgement (step 12).',
            'evidence' => array_filter([
                'invoice_document_id' => $invoice->id,
                'payment_status' => $status,
                'amount_received' => $payment?->amount_received,
            ], fn ($v) => $v !== null),
            'audience' => 'staff',
        ]]);
    }
}
