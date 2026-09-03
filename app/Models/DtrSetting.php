<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class DtrSetting extends Model
{
    /** Day-of-week keys used by weekly_schedule, Monday first. */
    public const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    protected $fillable = [
        'user_id', 'label', 'position', 'employment_type', 'team', 'timezone',
        'sched_in', 'sched_out', 'weekly_schedule', 'schedule_type', 'break_hours', 'reports_to',
        'std_hours', 'grace_mins', 'break_after', 'is_complete', 'archived_at',
    ];

    protected $casts = [
        'break_hours' => 'decimal:2',
        'std_hours' => 'decimal:2',
        'break_after' => 'decimal:2',
        'grace_mins' => 'integer',
        'is_complete' => 'boolean',
        'weekly_schedule' => 'array',
        'archived_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Resolve the schedule that applies on a given date, honouring the per-day
     * weekly_schedule when present. Returns ['working' => bool, 'in' => ?string,
     * 'out' => ?string]. With no weekly_schedule set, every day uses the flat
     * sched_in/sched_out (legacy behaviour). A day marked off => not working.
     */
    public function scheduleForDate($date): array
    {
        $legacy = ['working' => true, 'in' => $this->sched_in, 'out' => $this->sched_out];

        $ws = $this->weekly_schedule;
        if (empty($ws) || ! is_array($ws) || ! $date) {
            return $legacy;
        }

        $key = strtolower(Carbon::parse($date)->format('D')); // 'mon'..'sun'
        $day = $ws[$key] ?? null;

        if (! $day || empty($day['on'])) {
            return ['working' => false, 'in' => null, 'out' => null];
        }

        return [
            'working' => true,
            'in' => $day['in'] ?? $this->sched_in,
            'out' => $day['out'] ?? $this->sched_out,
        ];
    }
}
