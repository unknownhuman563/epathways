<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A generated Referral Agent Agreement PDF for an agent (a User with
 * role=agent). One current agreement per agent — regenerating replaces the
 * row. The captured fillable + Schedule A values live in `fields`.
 */
class AgentAgreement extends Model
{
    protected $fillable = [
        'agent_id',
        'fields',
        'file_path',
        'original_name',
        'mime',
        'size',
        'generated_by',
    ];

    protected $casts = [
        'fields' => 'array',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }
}
