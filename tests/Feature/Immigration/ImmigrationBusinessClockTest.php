<?php

namespace Tests\Feature\Immigration;

use App\Services\Immigration\ImmigrationBusinessClock;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * Build 12 phase 4.5 §15.3 — SLA is business time, not wall-clock, on the NZ
 * calendar. The headline case: Friday 5pm + 48h must NOT be overdue Monday
 * morning.
 */
class ImmigrationBusinessClockTest extends TestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_friday_5pm_plus_48h_is_not_overdue_monday_morning(): void
    {
        $clock = new ImmigrationBusinessClock;

        // A real Friday 5pm NZ (computed, not hard-coded to a weekday).
        $friday = Carbon::parse('2026-08-01 12:00', 'Pacific/Auckland')->next(Carbon::FRIDAY)->setTime(17, 0);
        $this->assertTrue($friday->isFriday());

        // 48h SLA = 2 business days → the following Tuesday 5pm (weekend skipped).
        $due = $clock->dueFor(['type' => 'duration', 'business_days' => 2], $friday);
        $this->assertTrue($due->equalTo($friday->copy()->addDays(4)->setTime(17, 0)), 'due should be Tuesday 5pm');
        $this->assertTrue($due->isTuesday());

        // Monday morning (Fri + 3 days): NOT overdue.
        Carbon::setTestNow($friday->copy()->addDays(3)->setTime(9, 0));
        $this->assertFalse($clock->isOverdue($due));

        // Tuesday evening (past due): overdue.
        Carbon::setTestNow($friday->copy()->addDays(4)->setTime(18, 0));
        $this->assertTrue($clock->isOverdue($due));
    }

    public function test_24h_from_friday_is_one_business_day_to_monday(): void
    {
        $clock = new ImmigrationBusinessClock;
        $friday = Carbon::parse('2026-08-01 12:00', 'Pacific/Auckland')->next(Carbon::FRIDAY)->setTime(17, 0);

        // 24h SLA = 1 business day → Monday 5pm (not Saturday).
        $due = $clock->dueFor(['type' => 'duration', 'business_days' => 1], $friday);
        $this->assertTrue($due->isMonday());
        $this->assertSame('17:00', $due->format('H:i'));
    }
}
