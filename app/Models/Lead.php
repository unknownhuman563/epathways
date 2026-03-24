<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model
{
    protected $fillable = [
        'lead_id', 'first_name', 'last_name', 'age', 'email', 'phone', 
        'gender', 'marital_status', 'branch', 'stage', 'status', 
        'work_info', 'financial_info', 'event_id', 'event_session_id'
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
