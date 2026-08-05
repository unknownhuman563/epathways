<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Minimum payment state (Build 12 phase 4.5, §15.5) so step 11 "Payment
 * received" is a real gate and the phase-3 invoice-overdue rule can graduate.
 * Manual recording — amount_expected seeds from the invoice (a tool value,
 * never generated); receipts are recorded by a human. No gateway yet.
 */
class CasePayment extends Model
{
    public const STATUS_UNPAID = 'unpaid';

    public const STATUS_PART_PAID = 'part_paid';

    public const STATUS_PAID = 'paid';

    protected $fillable = [
        'lead_id', 'invoice_document_id', 'amount_expected', 'amount_received',
        'status', 'method', 'received_at', 'recorded_by',
    ];

    protected $casts = [
        'amount_expected' => 'decimal:2',
        'amount_received' => 'decimal:2',
        'received_at' => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    /** Derive the status from expected vs received — single source of truth. */
    public static function deriveStatus(float $expected, float $received): string
    {
        if ($received <= 0) {
            return self::STATUS_UNPAID;
        }

        return $received + 0.001 >= $expected ? self::STATUS_PAID : self::STATUS_PART_PAID;
    }

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }
}
