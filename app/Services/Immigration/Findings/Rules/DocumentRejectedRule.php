<?php

namespace App\Services\Immigration\Findings\Rules;

use App\Models\Lead;
use App\Services\Immigration\CaseChecklistService;
use App\Services\Immigration\Findings\FindingRule;
use App\Services\Immigration\Findings\RuleResult;

/**
 * A checklist item whose most recent upload was rejected — i.e. it was rejected
 * and not re-uploaded (the latest doc for that key is still the rejected one).
 */
class DocumentRejectedRule implements FindingRule
{
    public function __construct(private CaseChecklistService $checklist) {}

    public function evaluate(Lead $lead): RuleResult
    {
        $items = $this->checklist->withStatuses($lead);

        $findings = [];
        foreach ($items as $item) {
            if (($item['status'] ?? null) !== \App\Models\LeadDocument::STATUS_REJECTED) {
                continue;
            }
            $findings[] = [
                'finding_key' => "doc_rejected:{$item['key']}",
                'category' => $item['category'] ?: 'Documents',
                'severity' => 'check',
                'title' => "{$item['label']} was rejected — not re-uploaded",
                'detail' => $item['note'] ? "Reviewer note: {$item['note']}" : 'The latest upload for this item was rejected.',
                'evidence' => array_filter([
                    'checklist_key' => $item['key'],
                    'document_id' => $item['document_id'] ?? null,
                ], fn ($v) => $v !== null),
                'audience' => 'staff',
            ];
        }

        return new RuleResult($findings);
    }
}
