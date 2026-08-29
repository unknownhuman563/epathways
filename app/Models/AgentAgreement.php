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
        'agent_signer_name',
        'agent_signature_data',
        'agent_signed_at',
        'agent_signed_ip',
        'agent_signed_user_agent',
        'company_signer_name',
        'company_signature_data',
        'company_signed_at',
        'company_signed_by',
    ];

    protected $casts = [
        'fields' => 'array',
        'agent_signed_at' => 'datetime',
        'company_signed_at' => 'datetime',
    ];

    /** Has the agent e-signed this agreement? */
    public function isSignedByAgent(): bool
    {
        return $this->agent_signed_at !== null;
    }

    /** Has ePathways (staff) e-signed this agreement? */
    public function isSignedByCompany(): bool
    {
        return $this->company_signed_at !== null;
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }
}
