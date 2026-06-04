<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class WorkIntake extends Model
{
    protected $guarded = ['id', 'created_at', 'updated_at'];

    protected $casts = [
        'dob'                => 'date',
        'last_nz_departure'  => 'date',
        'job_start_date'     => 'date',
        'current_job_start'  => 'date',
        'signature_date'     => 'date',
        'hourly_rate'        => 'decimal:2',
        'previous_roles'     => 'array',
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
