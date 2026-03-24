<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Event;

class EventSession extends Model
{
    protected $fillable = [
        'event_id', 'venue_name', 'address', 'city', 'date',
        'time_start', 'time_end', 'capacity', 'registered_count', 'status'
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
