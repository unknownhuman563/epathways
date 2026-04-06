<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model
{
    protected $fillable = [
        'lead_id', 'first_name', 'last_name', 'dob', 'other_names', 'email', 'phone', 
        'gender', 'marital_status', 'branch', 'stage', 'status',
        'country_of_birth', 'place_of_birth', 'citizenship', 
        'residence_city', 'residence_state', 'residence_country',
        'has_passport', 'passport_number', 'passport_expiry', 'passport_path',
        'terms_accepted', 'work_info', 'financial_info', 'gap_explanation', 
        'education_notes', 'event_id', 'event_session_id'
    ];
    
    protected $casts = [
        'work_info' => 'array',
        'financial_info' => 'array',
        'age' => 'integer',
    ];

    public function educationExps(): HasMany
    {
        return $this->hasMany(LeadEducationExp::class);
    }
    
    public function studyPlans(): HasMany
    {
        return $this->hasMany(LeadStudyPlan::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
    
    public function eventSession()
    {
        return $this->belongsTo(EventSession::class);
    }
}
