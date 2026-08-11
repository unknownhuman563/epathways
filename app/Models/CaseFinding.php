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
        'actioned_by', 'actioned_at', 'dismiss_reason', 'dismissed_fingerprint',
        'first_seen_at', 'last_seen_at',
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

    /**
     * Fingerprint of the STABLE, situation-identifying evidence — what a
     * dismissal is scoped to. Volatile "_at" timestamps are excluded so a
     * time-based finding (no-contact) doesn't churn on every evaluation; the
     * identifiers that mean "a different situation" (document_id, passport
     * expiry, request_id, the engagement-doc set) are what change the hash and
     * re-open a dismissal.
     *
     * @param  array<string, mixed>  $evidence
     */
    public static function fingerprintFor(?array $evidence): string
    {
        $stable = collect($evidence ?? [])
            ->reject(fn ($v, $k) => str_ends_with((string) $k, '_at'))
            ->sortKeys()
            ->all();

        return hash('sha256', json_encode($stable));
    }
}
