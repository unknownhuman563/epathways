<?php

namespace App\Services\Immigration\Findings\Rules;

use App\Models\Lead;
use App\Services\Immigration\CaseChecklistService;
use App\Services\Immigration\Findings\FindingRule;
use App\Services\Immigration\Findings\RuleResult;

/**
 * A required checklist item the case hasn't uploaded. The name comes straight
 * from the checklist — "Police certificate (Philippines) not uploaded", never
 * "missing documents" — so it is never invented.
 */
class ChecklistItemMissingRule implements FindingRule
{
    public function __construct(private CaseChecklistService $checklist) {}

    public function evaluate(Lead $lead): RuleResult
    {
        $items = $this->checklist->withStatuses($lead);

        if (empty($items)) {
            return RuleResult::couldntVerify('No document checklist resolved for this visa type — required-document gaps can\'t be checked.');
        }

        $findings = [];
        foreach ($items as $item) {
            if (empty($item['required']) || $item['status'] !== 'not_submitted') {
                continue;
            }
            $findings[] = [
                'finding_key' => "checklist_missing:{$item['key']}",
                'category' => $item['category'] ?: 'Documents',
                'severity' => 'check',
                'title' => "{$item['label']} not uploaded",
                'detail' => 'Required for this visa and not yet submitted by the applicant.',
                'evidence' => ['checklist_key' => $item['key']],
                'audience' => 'staff',
            ];
        }

        return new RuleResult($findings);
    }
}
