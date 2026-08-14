<?php

namespace App\Traits;

use App\Models\FinancePayment;
use Illuminate\Support\Carbon;

/**
 * Shared money math for a ledger entry (a receivable invoice or a payable bill).
 * Every figure is derived from the payment rows + the due date — nothing here is
 * stored, so paid/balance/aging can never drift from the ledger.
 */
trait HasPaymentLedger
{
    public function payments()
    {
        return $this->morphMany(FinancePayment::class, 'paymentable')->orderByDesc('paid_on');
    }

    /** Sum of the payment ledger. Uses the loaded relation when available. */
    public function getAmountPaidAttribute(): float
    {
        $sum = $this->relationLoaded('payments')
            ? $this->payments->sum('amount')
            : $this->payments()->sum('amount');

        return round((float) $sum, 2);
    }

    /** Outstanding balance (can go slightly negative on an overpayment). */
    public function getBalanceAttribute(): float
    {
        return round((float) $this->amount - $this->amount_paid, 2);
    }

    /** Whole days the entry is past its due date (0 if not yet due). */
    public function getDaysPastDueAttribute(): int
    {
        if (! $this->due_date) {
            return 0;
        }
        $diff = Carbon::today()->diffInDays(Carbon::parse($this->due_date)->startOfDay(), false);

        return $diff < 0 ? (int) abs($diff) : 0;
    }

    /** void | paid | partial | overdue | open — derived from the ledger + due date. */
    public function getPaymentStatusAttribute(): string
    {
        if ($this->status === 'void') {
            return 'void';
        }
        if ((float) $this->amount > 0 && $this->balance <= 0.005) {
            return 'paid';
        }
        if ($this->days_past_due > 0) {
            return 'overdue';
        }

        return $this->amount_paid > 0.005 ? 'partial' : 'open';
    }

    /** Aging band of the outstanding balance, by days past due. */
    public function getAgingBucketAttribute(): string
    {
        $d = $this->days_past_due;
        if ($d <= 0) {
            return 'current';
        }
        if ($d <= 30) {
            return '1-30';
        }
        if ($d <= 60) {
            return '31-60';
        }
        if ($d <= 90) {
            return '61-90';
        }

        return '90+';
    }
}
