<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $table = 'app_settings';

    protected $fillable = ['key', 'value', 'type', 'label', 'group'];

    /**
     * Read a setting, casting based on its stored `type`. Returns $default if
     * the row is missing. Cached per-key for the request lifetime.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $row = Cache::store('array')->rememberForever("setting:{$key}", function () use ($key) {
            return self::query()->where('key', $key)->first();
        });

        if (!$row) return $default;

        return match ($row->type) {
            'int'  => (int) $row->value,
            'bool' => filter_var($row->value, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode((string) $row->value, true) ?? $default,
            default => $row->value,
        };
    }

    /**
     * Upsert a setting value. Existing row keeps its `type` / `label` / `group`
     * unless explicitly overridden.
     */
    public static function set(string $key, mixed $value, ?string $type = null, ?string $label = null, ?string $group = null): void
    {
        $stored = is_array($value) || is_object($value)
            ? json_encode($value)
            : (string) $value;

        $existing = self::query()->where('key', $key)->first();

        if ($existing) {
            $existing->update(array_filter([
                'value' => $stored,
                'type'  => $type,
                'label' => $label,
                'group' => $group,
            ], fn ($v) => $v !== null));
        } else {
            self::create([
                'key'   => $key,
                'value' => $stored,
                'type'  => $type ?: (is_int($value) ? 'int' : (is_bool($value) ? 'bool' : 'string')),
                'label' => $label,
                'group' => $group,
            ]);
        }

        Cache::store('array')->forget("setting:{$key}");
    }
}
