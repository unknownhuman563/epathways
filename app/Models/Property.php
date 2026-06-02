<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Property extends Model
{
    use LogsActivity;

    protected $table = 'accommodation_properties';

    protected $fillable = [
        'name', 'location', 'suburb', 'room_type', 'has_wardrobe', 'bed_type',
        'bathroom_type', 'includes', 'rent_single', 'rent_couple',
        'bills_excluded', 'description', 'status',
    ];

    protected $casts = [
        'has_wardrobe' => 'boolean',
        'bills_excluded' => 'boolean',
        'rent_single' => 'decimal:2',
        'rent_couple' => 'decimal:2',
    ];

    protected $appends = ['cover_image'];

    protected static function booted(): void
    {
        // Delete each image via Eloquent so its file is cleaned up (the DB
        // cascade alone would not fire PropertyImage's deleting event).
        static::deleting(function (Property $property) {
            $property->images()->get()->each->delete();
        });
    }

    public function images(): HasMany
    {
        return $this->hasMany(PropertyImage::class)->orderBy('sort_order');
    }

    public function getCoverImageAttribute(): ?string
    {
        // Only use the eager-loaded relation; never fire a lazy query here,
        // otherwise serializing a list of properties would cause N+1.
        // Controllers that need the cover image must Property::with('images').
        if (! $this->relationLoaded('images')) {
            return null;
        }

        return optional($this->images->first())->url;
    }
}
