<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A lead's sub-agent contact facts (best time to call, preferred channel,
 * languages, emergency contact, stated goal) — 1-to-1 with the lead, kept off
 * the wide `leads` table on purpose. See the create migration.
 */
class LeadContactProfile extends Model
{
    protected $fillable = [
        'lead_id',
        'best_time_to_call',
        'preferred_channel',
        'languages',
        'emergency_contact',
        'goal',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }
}
