<?php

namespace App\Services\Immigration;

use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;

/**
 * The one place SLA due-times are computed (Build 12 phase 4.5, §15.3). This is
 * where the codebase's UTC/NZ mismatch would otherwise bite, so it is isolated
 * and tested across weekends and the DST boundary.
 *
 * Rules:
 *   - Durations are BUSINESS DAYS, not wall-clock. "48 hrs" is 2 business days,
 *     "24 hrs" is 1 — so Friday 5pm + 48h lands Tuesday 5pm, not Sunday, and
 *     isn't overdue on Monday morning.
 *   - The canonical calendar is Pacific/Auckland (operating entity + INZ
 *     deadlines are NZ). PH/NZ team spread is a display concern only.
 *   - Returned instants are timezone-aware Carbons; store them as-is (Laravel
 *     persists UTC) and render in the viewer's zone.
 */
class ImmigrationBusinessClock
{
    private string $tz = 'Pacific/Auckland';

    /** @return array<int, string> Y-m-d holiday dates (NZ), from config. */
    private function holidays(): array
    {
        return (array) config('immigration.business_holidays', []);
    }

    private function isBusinessDay(CarbonInterface $d): bool
    {
        return $d->isWeekday() && ! in_array($d->format('Y-m-d'), $this->holidays(), true);
    }

    /**
     * $from + N business days, preserving the time of day. Counts only
     * business days, so weekends (and configured holidays) don't burn SLA.
     */
    public function addBusinessDays(CarbonInterface $from, int $days): Carbon
    {
        $d = Carbon::parse($from)->setTimezone($this->tz);
        $added = 0;
        while ($added < max(0, $days)) {
            $d->addDay();
            if ($this->isBusinessDay($d)) {
                $added++;
            }
        }

        return $d;
    }

    /**
     * Compute a step's `due_at` from its SLA descriptor and the moment it became
     * active. Returns null when the SLA can't be pinned yet (e.g. a milestone
     * SLA whose anchor — lodgement — hasn't happened) or has no due instant
     * (recurring cadences are checked by the rule, not a one-shot due).
     *
     * @param  array<string, mixed>|null  $sla
     * @param  array<string, mixed>  $context  e.g. ['lodged_at' => Carbon, 'processing_days' => int]
     */
    public function dueFor(?array $sla, CarbonInterface $activatedAt, array $context = []): ?Carbon
    {
        if (! $sla || empty($sla['type'])) {
            return null;
        }

        return match ($sla['type']) {
            // {type: duration, business_days: N}
            'duration' => $this->addBusinessDays($activatedAt, (int) ($sla['business_days'] ?? 0)),

            // {type: milestone, of: 'processing', fraction: 0.5} — e.g. "at 50%".
            // Calendar time: INZ processing is wall-clock, not business days.
            'milestone' => isset($context['lodged_at'], $context['processing_days'])
                ? Carbon::parse($context['lodged_at'])->setTimezone($this->tz)
                    ->addDays((int) floor(((float) ($sla['fraction'] ?? 0.5)) * (int) $context['processing_days']))
                : null,

            // Recurring cadences (e.g. weekly Friday updates) have no single
            // due instant — OverdueStepRule evaluates the cadence directly.
            default => null,
        };
    }

    /** True when a due instant is in the past (overdue). */
    public function isOverdue(?CarbonInterface $dueAt): bool
    {
        return $dueAt !== null && Carbon::parse($dueAt)->isPast();
    }

    /**
     * Recurring-cadence check (step 14, "Friday updates"). True when the cadence
     * has lapsed — nothing logged in the trailing window (a week for a weekly
     * cadence), or nothing ever logged. Evaluated in NZ so "a week" is a NZ week.
     *
     * @param  array<string, mixed>  $sla  {type: recurring, every: week|day}
     */
    public function recurringOverdue(?CarbonInterface $lastLoggedAt, array $sla): bool
    {
        $days = ($sla['every'] ?? 'week') === 'day' ? 1 : 7;
        if (! $lastLoggedAt) {
            return true;
        }

        return Carbon::parse($lastLoggedAt)->setTimezone($this->tz)
            ->lt(Carbon::now($this->tz)->subDays($days));
    }
}
