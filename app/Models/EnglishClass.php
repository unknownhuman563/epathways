<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class EnglishClass extends Model
{
    use LogsActivity, SoftDeletes;

    protected $table = 'english_classes';

    public const STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];

    protected $fillable = [
        'name',
        'description',
        'instructor_id',
        'schedule_text',
        'location',
        'capacity',
        'status',
        'starts_at',
        'ends_at',
    ];

    protected $casts = [
        'capacity'  => 'integer',
        'starts_at' => 'date',
        'ends_at'   => 'date',
    ];

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(EnglishClassEnrollment::class);
    }

    public function learners(): BelongsToMany
    {
        return $this->belongsToMany(Lead::class, 'english_class_enrollments')
            ->withPivot(['status', 'enrolled_at', 'completed_at', 'notes'])
            ->withTimestamps();
    }
}
