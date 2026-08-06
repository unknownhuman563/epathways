<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingReminder extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_SENDING = 'sending';

    public const STATUS_SENT = 'sent';

    public const STATUS_FAILED = 'failed';

    public const STATUS_CANCELED = 'canceled';

    protected $fillable = ['booking_id', 'template_key', 'send_at', 'status', 'sent_at'];

    protected $casts = [
        'send_at' => 'datetime',
        'sent_at' => 'datetime',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
}
