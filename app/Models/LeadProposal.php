<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A single saved version of a lead's program proposal (the shortlist of
 * suggested programs at a point in time). Kept as history so creating a new
 * proposal never discards the previous one. The latest row mirrors the
 * lead's active `proposed_program_ids`.
 */
class LeadProposal extends Model
{
    protected $fillable = [
        'lead_id', 'program_ids', 'reasons', 'selected_program_id', 'created_by',
    ];

    protected $casts = [
        'program_ids' => 'array',
        'reasons' => 'array',
    ];

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function selectedProgram()
    {
        return $this->belongsTo(Program::class, 'selected_program_id');
    }
}
