<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Program extends Model
{
    protected $fillable = [
        'title',
        'slug',
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
        'specialization',
        'employment_outcomes',
        'post_study',
        'other_benefits',
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
        'entry_requirements' => 'array',
        'employment_outcomes' => 'array',
        'other_benefits' => 'array',
    ];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    protected static function booted(): void
    {
        static::saving(function (Program $program) {
            if (empty($program->slug) && ! empty($program->title)) {
                $program->slug = static::generateUniqueSlug($program->title, $program->id);
            }
        });
    }

    public static function generateUniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title) ?: 'program';
        $slug = $base;
        $i = 2;
        while (
            static::where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $base.'-'.$i;
            $i++;
        }

        return $slug;
    }
}
