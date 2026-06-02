<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class PropertyImage extends Model
{
    protected $table = 'accommodation_property_images';

    protected $fillable = ['property_id', 'path', 'sort_order'];

    protected $appends = ['url'];

    protected static function booted(): void
    {
        // Remove the file from disk whenever the row is deleted (individually
        // or via the parent Property's cascade in Property::booted()).
        static::deleting(function (PropertyImage $image) {
            if ($image->path) {
                Storage::disk('public')->delete($image->path);
            }
        });
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function getUrlAttribute(): ?string
    {
        return $this->path ? Storage::disk('public')->url($this->path) : null;
    }
}
