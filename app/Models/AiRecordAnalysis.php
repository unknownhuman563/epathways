<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * A cached AI assessment of one CRM record (a Lead today; cases/students
 * later — hence the polymorphic `record`). One row per analysis run; the
 * freshest non-expired row for a record is served from cache.
 */
class AiRecordAnalysis extends Model
{
    protected $fillable = [
        'record_type', 'record_id', 'health', 'summary', 'flags',
        'recommendations', 'score', 'model_used', 'tokens_used',
        'analyzed_at', 'expires_at',
    ];

    protected $casts = [
        'flags'           => 'array',
        'recommendations' => 'array',
        'score'           => 'integer',
        'tokens_used'     => 'integer',
        'analyzed_at'     => 'datetime',
        'expires_at'      => 'datetime',
    ];

    public function record(): MorphTo
    {
        return $this->morphTo();
    }

    /** True while the cached analysis is still within its TTL window. */
    public function isFresh(): bool
    {
        return $this->expires_at && $this->expires_at->isFuture();
    }

    public function isCritical(): bool
    {
        return $this->health === 'critical';
    }
}
