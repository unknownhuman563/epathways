<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class VisitorIntake extends Model
{
    protected $guarded = ['id', 'created_at', 'updated_at'];

    protected $casts = [
        'dob'                => 'date',
        'passport_expiry'    => 'date',
        'last_nz_departure'  => 'date',
        'current_job_start'  => 'date',
        'intended_from'      => 'date',
        'intended_to'        => 'date',
        'signature_date'     => 'date',
        'family_members'     => 'array',
        'nz_contacts'        => 'array',
        'travel_trips'       => 'array',
        'declaration_accepted' => 'bool',
    ];

    public function assessment(): MorphOne
    {
        return $this->morphOne(Assessment::class, 'intakeable');
    }
}
