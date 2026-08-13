<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * An internal staff note on a visa assessment (a visa intake or a
 * free-assessment Lead). Attributed to its author so advisers can see who
 * noted what and when. Internal only — never surfaced to the client.
 */
class AssessmentNote extends Model
{
    protected $fillable = [
        'notable_type', 'notable_id', 'user_id', 'author_name', 'author_role', 'body',
    ];

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function notable(): MorphTo
    {
        return $this->morphTo();
    }
}
