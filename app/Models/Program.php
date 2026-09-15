<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Program extends Model
{
    use LogsActivity;

    protected $fillable = [
        'title',
        'slug',
        'institution',
        'school_id',
        'location',
        'level',
        'category',
        'industry',
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
        'tuition_fees',
        'insurance_fee',
        'visa_processing_fee',
        'living_expense',
        'accommodation',
    ];

    protected $casts = [
        'fee_guide' => 'array',
        'tuition_fees' => 'array',
        'entry_requirements' => 'array',
        'employment_outcomes' => 'array',
        'other_benefits' => 'array',
    ];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * The full program payload the ProgramDetailsModal renders (tracker + staff
     * lead profile share this so the modal shows identical info everywhere).
     */
    public function detailPayload(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'institution' => $this->institution ?: optional($this->school)->name,
            'location' => $this->location,
            'level' => $this->level,
            'category' => $this->category,
            'industry' => $this->industry,
            'price_text' => $this->price_text,
            'image_url' => $this->image ? \Illuminate\Support\Facades\Storage::disk('public')->url($this->image) : null,
            'description' => $this->description,
            'intake_months' => $this->intake_months,
            'duration_months' => $this->duration_months,
            'credits' => $this->credits,
            'residency_points' => $this->residency_points,
            'hours_per_week' => $this->hours_per_week,
            'entry_requirements' => $this->entry_requirements,
            'english_requirements' => $this->english_requirements,
            'specialization' => $this->specialization,
            'employment_outcomes' => $this->employment_outcomes,
            'post_study' => $this->post_study,
            'other_benefits' => $this->other_benefits,
            'tuition_fee' => $this->tuition_fee,
            'tuition_fee_notes' => $this->tuition_fee_notes,
            'tuition_fees' => $this->tuition_fees,
            'insurance_fee' => $this->insurance_fee,
            'visa_processing_fee' => $this->visa_processing_fee,
            'living_expense' => $this->living_expense,
            'accommodation' => $this->accommodation,
        ];
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
