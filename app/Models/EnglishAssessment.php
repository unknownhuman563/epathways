<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class EnglishAssessment extends Model
{
    use LogsActivity, SoftDeletes;

    public const TYPES = ['mock', 'official_pte', 'diy', 'other'];

    protected $fillable = [
        'lead_id',
        'english_class_id',
        'assessment_type',
        'assessment_date',
        'overall_score',
        'reading_score',
        'writing_score',
        'listening_score',
        'speaking_score',
        'passed',
        'notes',
        'administered_by',
    ];

    protected $casts = [
        'assessment_date' => 'date',
        'overall_score'   => 'decimal:2',
        'reading_score'   => 'decimal:2',
        'writing_score'   => 'decimal:2',
        'listening_score' => 'decimal:2',
        'speaking_score'  => 'decimal:2',
        'passed'          => 'boolean',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function englishClass(): BelongsTo
    {
        return $this->belongsTo(EnglishClass::class);
    }

    public function administrator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'administered_by');
    }
}
