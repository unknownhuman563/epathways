<?php

namespace App\Services\Immigration\Findings;

use App\Models\Lead;

/**
 * One rule = one small class. Given a case, it returns the findings it sees and
 * anything it couldn't check. Rules never touch the database — the service owns
 * persistence, dedup and resolution. A finding is a plain array:
 *
 *   [
 *     'finding_key' => 'checklist_missing:police_cert', // stable per rule+subject
 *     'category'    => 'Documents',
 *     'severity'    => 'blocking'|'check'|'info',
 *     'title'       => 'Police certificate (Philippines) not uploaded', // names the thing
 *     'detail'      => '...',
 *     'evidence'    => ['checklist_key' => 'police_cert', 'document_id' => 12, ...],
 *     'audience'    => 'staff'|'adviser'|'both',
 *   ]
 */
interface FindingRule
{
    public function evaluate(Lead $lead): RuleResult;
}
