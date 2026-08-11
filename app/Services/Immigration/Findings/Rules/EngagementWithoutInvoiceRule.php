<?php

namespace App\Services\Immigration\Findings\Rules;

use App\Models\Lead;
use App\Models\LeadDocument;
use App\Services\Immigration\Findings\FindingRule;
use App\Services\Immigration\Findings\RuleResult;

/**
 * An engagement pack has been generated but no invoice has been raised — the
 * same "ready to invoice" signal the Invoice workspace surfaces, brought onto
 * the case's own findings list.
 */
class EngagementWithoutInvoiceRule implements FindingRule
{
    public function evaluate(Lead $lead): RuleResult
    {
        $engagementDocs = LeadDocument::query()
            ->where('lead_id', $lead->id)
            ->where('source_variant', 'like', 'engagement:%')
            ->pluck('id');

        if ($engagementDocs->isEmpty()) {
            return RuleResult::empty();
        }

        $hasInvoice = LeadDocument::query()
            ->where('lead_id', $lead->id)
            ->where('source_variant', 'invoice')
            ->exists();

        if ($hasInvoice) {
            return RuleResult::empty();
        }

        return new RuleResult([[
            'finding_key' => 'engagement_no_invoice',
            'category' => 'Billing',
            'severity' => 'check',
            'title' => 'Engagement pack generated but no invoice raised',
            'detail' => 'The client has an engagement pack but hasn\'t been invoiced — raise the invoice.',
            'evidence' => ['engagement_document_ids' => $engagementDocs->all()],
            'audience' => 'staff',
        ]]);
    }
}
