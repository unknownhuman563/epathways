<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * A Facebook video/reel testimonial shown on the landing page.
 */
class VideoTestimonial extends Model
{
    public const ORIENTATIONS = ['portrait', 'landscape'];

    protected $fillable = ['url', 'orientation', 'caption', 'is_published', 'sort_order'];

    protected $casts = [
        'is_published' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    /** Ordered for display: manual sort first, then newest. */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderByDesc('id');
    }

    public function toPublicArray(): array
    {
        return [
            'id' => $this->id,
            'url' => $this->url,
            'orientation' => $this->orientation,
            'caption' => $this->caption,
        ];
    }
}
