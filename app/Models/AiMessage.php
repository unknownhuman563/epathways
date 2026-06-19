<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One turn in an AiConversation — a user prompt, an assistant reply, or a
 * system message. `metadata` carries the model used / token usage for cost
 * monitoring.
 */
class AiMessage extends Model
{
    protected $fillable = ['ai_conversation_id', 'role', 'content', 'metadata', 'token_count'];

    protected $casts = [
        'metadata'    => 'array',
        'token_count' => 'integer',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(AiConversation::class, 'ai_conversation_id');
    }
}
