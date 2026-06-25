<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

/**
 * A persistent AI chat thread owned by one staff member. Survives across
 * sessions; the last N messages are replayed as context on each turn.
 */
class AiConversation extends Model
{
    protected $fillable = ['user_id', 'title', 'last_message_at', 'is_archived'];

    protected $casts = [
        'last_message_at' => 'datetime',
        'is_archived'     => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(AiMessage::class)->orderBy('created_at');
    }

    /**
     * The most recent $limit messages in chronological order — what we send
     * to the model as context. reorder() drops the relation's default asc
     * ordering so latest() genuinely takes the newest rows.
     */
    public function latestMessages(int $limit = 20): Collection
    {
        return $this->messages()
            ->reorder('created_at', 'desc')
            ->take($limit)
            ->get()
            ->reverse()
            ->values();
    }
}
