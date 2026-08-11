<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Per-case record of the last findings evaluation (Build 12 phase 3): when it
 * ran, and what it could NOT check. The panel renders `evaluated_at` as its
 * timestamp and `couldnt_verify` as the required "couldn't verify" line.
 */
class CaseFindingRun extends Model
{
    protected $fillable = ['lead_id', 'evaluated_at', 'couldnt_verify'];

    protected $casts = [
        'evaluated_at' => 'datetime',
        'couldnt_verify' => 'array',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }
}
