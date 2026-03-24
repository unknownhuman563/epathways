<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadEducationExp extends Model
{
    protected $fillable = [
        'lead_id', 'level', 'institution', 'start_date', 'end_date', 
        'average_marks', 'field_of_study', 'gap_explanation', 'documents'
    ];
    
    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'documents' => 'array',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }
}
