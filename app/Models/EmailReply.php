<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An inbound email reply pulled from the monitored mailbox (hello@epathways.ph)
 * over IMAP and matched to a lead by sender address. Powers the Email Replies
 * inbox.
 */
class EmailReply extends Model
{
    protected $fillable = [
        'lead_id', 'direction', 'from_email', 'from_name', 'to_email', 'sent_by_user_id',
        'subject', 'body_text', 'body_html', 'message_id', 'in_reply_to',
        'received_at', 'is_read',
    ];

    protected $casts = [
        'received_at' => 'datetime',
        'is_read' => 'boolean',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }
}
