<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use LogsActivity;

    protected $fillable = [
        'name', 'description', 'type', 'event_code', 'date_from', 'date_to',
        'status', 'organizer_id', 'registration_link', 'notes', 'mode', 'banner_image'
    ];

    protected $casts = [
        'date_from' => 'date',
        'date_to' => 'date',
    ];

    public function sessions()
    {
        return $this->hasMany(EventSession::class);
    }

    public function leads()
    {
        return $this->hasMany(Lead::class);
    }
}
