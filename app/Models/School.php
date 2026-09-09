<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class School extends Model
{
    protected $fillable = [
        'name', 'slug', 'logo_path', 'country', 'city', 'website', 'description', 'status',
        'contacts',
        'portal_username', 'portal_password', 'portal_link',
        'agreement_path', 'agreement_name',
    ];

    protected $casts = [
        'contacts' => 'array',
    ];

    // Never leak the raw file path or portal password by default — the profile
    // page surfaces the password explicitly and the agreement only via a
    // gated download route.
    protected $hidden = [
        'agreement_path',
    ];

    // Expose a ready-to-use public URL for the logo in every JSON payload.
    protected $appends = [
        'logo_url',
    ];

    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo_path ? Storage::disk('public')->url($this->logo_path) : null;
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    protected static function booted(): void
    {
        static::saving(function (School $school) {
            if (empty($school->slug) && ! empty($school->name)) {
                $school->slug = static::generateUniqueSlug($school->name, $school->id);
            }
        });
    }

    public static function generateUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'school';
        $slug = $base;
        $i = 1;
        while (static::where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists()
        ) {
            $slug = "{$base}-".++$i;
        }

        return $slug;
    }

    /** Students currently associated with this school. */
    public function students(): HasMany
    {
        return $this->hasMany(Lead::class, 'school_id');
    }
}
