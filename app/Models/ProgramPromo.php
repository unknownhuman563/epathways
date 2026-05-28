<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ProgramPromo extends Model
{
    use LogsActivity;

    protected $fillable = [
        'program_id',
        'title',
        'description',
        'percent',
        'date_from',
        'date_end',
        'is_active',
        'promo_code',
        'banner_image',
        'cta_label',
        'cta_link',
        'created_by',
    ];

    protected $casts = [
        'percent'    => 'decimal:2',
        'date_from'  => 'date',
        'date_end'   => 'date',
        'is_active'  => 'boolean',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** Promos that should appear publicly *right now*. */
    public function scopeActive(Builder $query): Builder
    {
        $today = now()->toDateString();

        return $query->where('is_active', true)
            ->whereDate('date_from', '<=', $today)
            ->whereDate('date_end', '>=', $today);
    }

    public function getBannerUrlAttribute(): ?string
    {
        return $this->banner_image
            ? Storage::disk('public')->url($this->banner_image)
            : null;
    }

    public function toPublicArray(): array
    {
        $program = $this->relationLoaded('program') ? $this->program : null;
        $programImageUrl = ($program && $program->image)
            ? Storage::disk('public')->url($program->image)
            : null;

        return [
            'id'            => $this->id,
            'title'         => $this->title,
            'description'   => $this->description,
            'percent'       => (float) $this->percent,
            'date_from'     => optional($this->date_from)->toDateString(),
            'date_end'      => optional($this->date_end)->toDateString(),
            'promo_code'    => $this->promo_code,
            // Resolved image — uploaded promo banner takes precedence, else
            // the program's own hero image, else null (UI shows % fallback).
            'image_url'     => $this->banner_url ?: $programImageUrl,
            'banner_url'    => $this->banner_url,
            'cta_label'     => $this->cta_label,
            'cta_link'      => $this->cta_link ?: ($program && $program->slug ? "/program-details/{$program->slug}" : null),
            'program' => $program ? [
                'id'        => $program->id,
                'title'     => $program->title,
                'slug'      => $program->slug,
                'level'     => $program->level,
                'image_url' => $programImageUrl,
            ] : null,
        ];
    }
}
