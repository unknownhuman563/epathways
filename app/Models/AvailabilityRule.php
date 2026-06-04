<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AvailabilityRule extends Model
{
    protected $fillable = [
        'day_of_week',
        'start_time',
        'end_time',
        'slot_minutes',
        'user_id',
        'active',
        'label',
    ];

    protected $casts = [
        'day_of_week'  => 'int',
        'slot_minutes' => 'int',
        'active'       => 'bool',
    ];

    public const DAYS = [
        0 => 'Sunday',
        1 => 'Monday',
        2 => 'Tuesday',
        3 => 'Wednesday',
        4 => 'Thursday',
        5 => 'Friday',
        6 => 'Saturday',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
