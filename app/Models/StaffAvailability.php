<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffAvailability extends Model
{
    /** Days in display order (Mon → Sun). */
    public const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    protected $fillable = ['user_id', 'schedule'];

    protected $casts = ['schedule' => 'array'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Default weekday 9–5, weekend off. */
    public static function defaultSchedule(): array
    {
        $out = [];
        foreach (self::DAYS as $day) {
            $weekend = in_array($day, ['sat', 'sun'], true);
            $out[$day] = [
                'enabled' => ! $weekend,
                'start' => '09:00',
                'end' => $weekend ? '13:00' : '17:00',
            ];
        }

        return $out;
    }
}
