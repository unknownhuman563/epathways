<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A case's state for one step ATTEMPT (Build 12 phase 4.5). Append-only per
 * (lead, step_key, attempt): re-entry (RFI, rejected doc, needs_something)
 * opens a new attempt rather than mutating the completed one, so history and
 * per-attempt SLA survive. Current state of a step = its highest-attempt row.
 *
 * qc_result is procedural — NOT advice, never routed through AdviceBearingPolicy.
 */
class CaseStepState extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_DONE = 'done';

    public const STATUS_BLOCKED = 'blocked';

    public const STATUS_NOT_APPLICABLE = 'not_applicable';

    /** Statuses that count as "this step is satisfied for dependency purposes". */
    public const SATISFIED = [self::STATUS_DONE, self::STATUS_NOT_APPLICABLE];

    protected $fillable = [
        'lead_id', 'step_key', 'attempt', 'status', 'owner_user_id',
        'activated_at', 'due_at', 'completed_by', 'completed_at', 'qc_result',
        'channels', 'reactivation_trigger', 'reactivation_reason', 'reactivated_from_attempt',
    ];

    protected $casts = [
        'attempt' => 'integer',
        'activated_at' => 'datetime',
        'due_at' => 'datetime',
        'completed_at' => 'datetime',
        'channels' => 'array',
        'reactivated_from_attempt' => 'integer',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(CaseStepTemplate::class, 'step_key', 'step_key');
    }

    public function isSatisfied(): bool
    {
        return in_array($this->status, self::SATISFIED, true);
    }
}
