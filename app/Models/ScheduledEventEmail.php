<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduledEventEmail extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_SENDING = 'sending';

    public const STATUS_SENT = 'sent';

    public const STATUS_CANCELED = 'canceled';

    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'event_id',
        'created_by',
        'template_id',
        'subject',
        'body',
        'recipient_ids',
        'scheduled_at',
        'status',
        'sent_count',
        'failed_count',
        'sent_at',
    ];

    protected $casts = [
        'recipient_ids' => 'array',
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** Only a still-pending email can be canceled before it fires. */
    public function isCancelable(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }
}
