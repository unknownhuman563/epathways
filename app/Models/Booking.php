<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use LogsActivity;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'service_type',
        'consultant_name',
        'message',
        'platform',
        'status',
        'current_country',
        'appointment_date',
        'appointment_time',
    ];

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }
}
