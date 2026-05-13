<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResidentIntake extends Model
{
    protected $fillable = [
        'intake_id',
        'first_name',
        'last_name',
        'dob',
        'nationality',
        'email',
        'phone',
        'passport_number',
        'passport_expiry',
        'issuing_country',
        'current_visa_type',
        'current_visa_other',
        'current_visa_expiry',
        'nz_arrival_date',
        'previous_nz_visa_history',
        'job_title',
        'employment_start',
        'employment_type',
        'hourly_rate',
        'highest_qualification',
        'institution_name',
        'country_of_study',
        'nzqa_status',
        'nzqa_iqa_reference',
        'nz_skilled_years',
        'total_skilled_years',
        'career_summary',
        'english_evidence',
        'english_test_score',
        'english_test_date',
        'include_family',
        'family_members',
        'documents',
        'document_files',
        'character_health_disclosure',
        'other_notes',
        'status',
    ];

    protected $casts = [
        'dob' => 'date',
        'passport_expiry' => 'date',
        'current_visa_expiry' => 'date',
        'nz_arrival_date' => 'date',
        'employment_start' => 'date',
        'english_test_date' => 'date',
        'documents' => 'array',
        'document_files' => 'array',
        'family_members' => 'array',
        'hourly_rate' => 'decimal:2',
        'nz_skilled_years' => 'decimal:1',
        'total_skilled_years' => 'decimal:1',
    ];
}
