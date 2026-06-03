<?php

namespace App\Services;

use App\Models\AvailabilityRule;
use App\Models\Booking;
use Carbon\Carbon;
use Carbon\CarbonImmutable;

/**
 * Combines weekly availability rules with already-taken bookings to produce the
 * pool of free slots a client can pick from on the booking step.
 *
 * Rules are recurring (day-of-week + time range + slot length). Bookings carve
 * out exact (date, time) cells. Output is grouped by date so the frontend can
 * render a calendar without further bucketing.
 */
class SlotGenerator
{
    public function __construct(
        private readonly string $timezone = 'Pacific/Auckland',
    ) {}

    /**
     * @param  int  $days  How many days from today to include (e.g. 14).
     * @return array<int, array{date:string, weekday:string, slots:array<int,array{time:string, label:string}>}>
     */
    public function upcoming(int $days = 14): array
    {
        $rules = AvailabilityRule::query()
            ->where('active', true)
            ->get()
            ->groupBy('day_of_week');

        // Already-claimed (date, time) cells — string compare against
        // "HH:MM" works because every booking stores the same format.
        $taken = Booking::query()
            ->whereNotNull('appointment_date')
            ->whereNotNull('appointment_time')
            ->whereDate('appointment_date', '>=', now($this->timezone)->toDateString())
            ->get(['appointment_date', 'appointment_time'])
            ->map(fn ($b) => $b->appointment_date->format('Y-m-d') . ' ' . substr($b->appointment_time, 0, 5))
            ->flip(); // O(1) lookup

        $today = CarbonImmutable::now($this->timezone)->startOfDay();
        $out = [];

        for ($i = 0; $i < $days; $i++) {
            $date = $today->addDays($i);
            $dow  = (int) $date->format('w');
            $dayRules = $rules->get($dow);
            if (!$dayRules || $dayRules->isEmpty()) continue;

            $daySlots = [];
            foreach ($dayRules as $rule) {
                foreach ($this->expandRule($rule, $date) as $slot) {
                    // Skip past times when generating today's slots.
                    if ($date->isSameDay($today) && $slot['carbon']->isPast()) continue;
                    $key = $date->format('Y-m-d') . ' ' . $slot['time'];
                    if ($taken->has($key)) continue;
                    $daySlots[$slot['time']] = $slot;
                }
            }

            if (empty($daySlots)) continue;

            // Stable ordering by time-of-day.
            ksort($daySlots);
            $out[] = [
                'date'    => $date->format('Y-m-d'),
                'weekday' => $date->format('l'),
                'label'   => $date->format('D, j M'),
                'slots'   => array_values(array_map(fn ($s) => [
                    'time'  => $s['time'],
                    'label' => $s['label'],
                ], $daySlots)),
            ];
        }

        return $out;
    }

    /**
     * Walk one rule's start→end at slot_minutes increments, returning each
     * slot's wall-clock time + a friendly label ("10:00 AM").
     *
     * @return array<int, array{time:string, label:string, carbon:CarbonImmutable}>
     */
    private function expandRule(AvailabilityRule $rule, CarbonImmutable $date): array
    {
        $start = CarbonImmutable::parse($date->format('Y-m-d') . ' ' . $rule->start_time, $this->timezone);
        $end   = CarbonImmutable::parse($date->format('Y-m-d') . ' ' . $rule->end_time,   $this->timezone);
        $step  = max(15, $rule->slot_minutes);

        $slots = [];
        $cursor = $start;
        while ($cursor->lessThan($end)) {
            $slots[] = [
                'time'   => $cursor->format('H:i'),
                'label'  => $cursor->format('g:i A'),
                'carbon' => $cursor,
            ];
            $cursor = $cursor->addMinutes($step);
        }
        return $slots;
    }
}
