<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadTaskComment extends Model
{
    protected $fillable = ['lead_task_id', 'user_id', 'body'];

    public function task(): BelongsTo
    {
        return $this->belongsTo(LeadTask::class, 'lead_task_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
