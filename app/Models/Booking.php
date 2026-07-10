<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use LogsActivity;

    public const PAYMENT_UNPAID = 'unpaid';

    public const PAYMENT_PAID = 'paid';

    public const PAYMENT_REFUNDED = 'refunded';

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'service_type',
        'visa_type_id',
        'property_id',
        'consultant_name',
        'message',
        'platform',
        'status',
        'payment_status',
        'amount',
        'currency',
        'stripe_session_id',
        'paid_at',
        'current_country',
        'appointment_date',
        'appointment_time',
        'appointment_at',
        'client_timezone',
        'resident_intake_id',
        'lead_id',
    ];

    protected $casts = [
        'appointment_date' => 'date',
        'appointment_at' => 'datetime',
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    public function residentIntake()
    {
        return $this->belongsTo(ResidentIntake::class);
    }

    public function visaType()
    {
        return $this->belongsTo(VisaType::class);
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }
}
