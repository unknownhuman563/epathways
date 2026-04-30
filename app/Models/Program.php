<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Program extends Model
{
    protected $fillable = [
        'title',
        'institution',
        'location',
        'level',
        'category',
        'status',
        'price_text',
        'image',
        'description',
        'intake_months',
        'duration_months',
        'credits',
        'residency_points',
        'hours_per_week',
        'entry_requirements',
        'english_requirements',
        'employment_outcomes',
        'post_study',
        'fee_guide',
        'tuition_fee',
        'tuition_fee_notes',
        'insurance_fee',
        'visa_processing_fee',
        'living_expense',
        'accommodation',
    ];

    protected $casts = [
        'fee_guide' => 'array',
        'employment_outcomes' => 'array',
    ];
}
