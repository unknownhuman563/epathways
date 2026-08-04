<?php

namespace App\Services\Immigration\Findings\Rules;

use App\Models\Lead;
use App\Models\LeadDocumentRequest;
use App\Services\Immigration\Findings\FindingRule;
use App\Services\Immigration\Findings\RuleResult;

/**
 * A document the case requested from the client that has gone unanswered for
 * longer than the configured window (no upload against the request).
 */
class DocumentRequestUnansweredRule implements FindingRule
{
    public function evaluate(Lead $lead): RuleResult
    {
        $days = (int) config('immigration.findings.doc_request_unanswered_days', 5);
        $cutoff = now()->subDays($days);

        $requests = LeadDocumentRequest::query()
            ->where('lead_id', $lead->id)
            ->whereDoesntHave('documents')
            ->where('requested_at', '<', $cutoff)
            ->get();

        $findings = $requests->map(fn (LeadDocumentRequest $r) => [
            'finding_key' => "doc_request_unanswered:{$r->id}",
            'category' => 'Documents',
            'severity' => 'check',
            'title' => "\"{$r->label}\" requested — no response in {$days}+ days",
            'detail' => 'Requested from the client and not yet uploaded — follow up or resend.',
            'evidence' => array_filter([
                'request_id' => $r->id,
                'requested_at' => optional($r->requested_at)->toDateString(),
            ], fn ($v) => $v !== null),
            'audience' => 'staff',
        ])->all();

        return new RuleResult($findings);
    }
}
