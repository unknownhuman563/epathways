<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Internal staff note on a Lead. Authored by any logged-in staff user,
 * editable only by the original author (enforced at the controller).
 * Never surfaced in the lead-facing portal.
 */
class LeadNote extends Model
{
    use LogsActivity;

    protected $fillable = [
        'lead_id', 'user_id', 'author_name', 'author_role', 'body', 'pinned',
    ];

    protected $casts = [
        'pinned' => 'boolean',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Keep activity-log entries readable: "lead_note.created" etc. */
    public function activityNoun(): string
    {
        return 'lead_note';
    }
}
