<?php

namespace App\Models;

use App\Traits\HasPaymentLedger;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Accounts Payable — a bill ePathways owes a vendor / supplier.
 */
class FinancePayable extends Model
{
    use HasPaymentLedger;

    protected $fillable = [
        'bill_no', 'vendor_name', 'category', 'description', 'currency',
        'amount', 'issue_date', 'due_date', 'status', 'notes', 'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'issue_date' => 'date',
        'due_date' => 'date',
    ];

    protected $appends = ['amount_paid', 'balance', 'payment_status', 'days_past_due', 'aging_bucket'];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
