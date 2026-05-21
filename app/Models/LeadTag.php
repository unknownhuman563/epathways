<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class LeadTag extends Model
{
    use LogsActivity;

    protected $fillable = ['name', 'slug', 'color'];

    public function leads(): BelongsToMany
    {
        return $this->belongsToMany(Lead::class, 'lead_tag_lead')
            ->withTimestamps()
            ->withPivot('user_id');
    }

    /** Auto-pick a colour for a new tag based on its name hash. */
    public static function autoColor(string $name): string
    {
        $palette = ['gray', 'red', 'amber', 'green', 'blue', 'purple', 'pink', 'cyan', 'emerald', 'fuchsia'];
        return $palette[abs(crc32(strtolower($name))) % count($palette)];
    }

    /** Idempotent get-or-create by case-insensitive name. */
    public static function findOrCreateByName(string $name): self
    {
        $name = trim($name);
        $existing = self::whereRaw('LOWER(name) = ?', [strtolower($name)])->first();

        return $existing ?: self::create([
            'name'  => $name,
            'slug'  => Str::slug($name) ?: Str::random(8),
            'color' => self::autoColor($name),
        ]);
    }

    public function activityNoun(): string
    {
        return 'lead_tag';
    }
}
