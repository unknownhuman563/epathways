<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class StudentIntake extends Model
{
    protected $guarded = ['id', 'created_at', 'updated_at'];

    protected $casts = [
        'dob'                  => 'date',
        'passport_expiry'      => 'date',
        'last_nz_departure'    => 'date',
        'current_job_start'    => 'date',
        'current_job_finish'   => 'date',
        'study_period_from'    => 'date',
        'study_period_to'      => 'date',
        'signature_date'       => 'date',
        'tuition_fee_nzd'      => 'decimal:2',
        'living_expenses_nzd'  => 'decimal:2',
        'previous_nz_visas'    => 'array',
        'previous_nzeta'       => 'array',
        'australian_pr'        => 'array',
        'qualifications'       => 'array',
        'family_members'       => 'array',
        'nz_contacts'          => 'array',
        'travel_trips'         => 'array',
        'available_funds'      => 'array',
        'declaration_accepted' => 'bool',
    ];

    public function assessment(): MorphOne
    {
        return $this->morphOne(Assessment::class, 'intakeable');
    }
}
