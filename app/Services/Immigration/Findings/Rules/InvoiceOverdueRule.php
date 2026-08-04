<?php

namespace App\Services\Immigration\Findings\Rules;

use App\Models\Lead;
use App\Services\Immigration\Findings\FindingRule;
use App\Services\Immigration\Findings\RuleResult;

/**
 * Invoice generated, unpaid, past due. Invoices are generated as documents, but
 * payment status and due dates aren't tracked structurally yet — so this can't
 * be evaluated, and says so rather than pretending the case is clean. Wire the
 * real check when invoice payment tracking lands.
 */
class InvoiceOverdueRule implements FindingRule
{
    public function evaluate(Lead $lead): RuleResult
    {
        return RuleResult::couldntVerify('Invoice payment status and due dates aren\'t tracked yet — overdue invoices can\'t be flagged.');
    }
}
