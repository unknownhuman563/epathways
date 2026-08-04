<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A single case-assist finding (Build 12 phase 3). Written by the rules engine;
 * never destructively updated — a changed verdict is a status change, not a
 * delete. See App\Services\Immigration\CaseFindingService.
 */
class CaseFinding extends Model
{
    public const SEVERITIES = ['blocking', 'check', 'info'];

    public const STATUS_OPEN = 'open';

    public const STATUS_ACTIONED = 'actioned';

    public const STATUS_DISMISSED = 'dismissed';

    protected $fillable = [
        'lead_id', 'finding_key', 'category', 'severity', 'title', 'detail',
        'evidence', 'source', 'audience', 'status',
        'actioned_by', 'actioned_at', 'dismiss_reason', 'first_seen_at', 'last_seen_at',
    ];

    protected $casts = [
        'evidence' => 'array',
        'actioned_at' => 'datetime',
        'first_seen_at' => 'datetime',
        'last_seen_at' => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function actioner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actioned_by');
    }
}
