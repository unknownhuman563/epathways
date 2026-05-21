<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadTask extends Model
{
    use LogsActivity;

    public const PRIORITIES = ['low', 'normal', 'high', 'urgent'];

    protected $fillable = [
        'lead_id', 'created_by', 'assignee_id',
        'title', 'description', 'due_at', 'priority',
        'completed', 'completed_at', 'completed_by',
    ];

    protected $casts = [
        'due_at'       => 'datetime',
        'completed_at' => 'datetime',
        'completed'    => 'boolean',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** Open + overdue. Powers the sales "Due today" widget. */
    public function scopeDueToday(Builder $q): Builder
    {
        return $q->where('completed', false)
            ->whereNotNull('due_at')
            ->whereDate('due_at', '<=', now()->toDateString());
    }

    public function activityNoun(): string
    {
        return 'lead_task';
    }
}
