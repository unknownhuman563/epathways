<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EnglishClassEnrollment extends Model
{
    public const STATUSES = ['active', 'completed', 'withdrawn'];

    protected $fillable = [
        'english_class_id',
        'lead_id',
        'enrolled_at',
        'completed_at',
        'status',
        'notes',
    ];

    protected $casts = [
        'enrolled_at'  => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function englishClass(): BelongsTo
    {
        return $this->belongsTo(EnglishClass::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }
}
