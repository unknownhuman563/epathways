<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One receipt on a case's payment ledger (an instalment or a full payment).
 * The case's paid / owed / settled figures are summed from these rows.
 */
class CaseFinancePayment extends Model
{
    protected $fillable = ['lead_id', 'paid_at', 'amount', 'method', 'reference', 'recorded_by'];

    protected $casts = [
        'paid_at' => 'date',
        'amount' => 'decimal:2',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
