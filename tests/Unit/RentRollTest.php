<?php

namespace Tests\Unit;

use App\Support\RentRoll;
use Illuminate\Support\Carbon;
use PHPUnit\Framework\TestCase;

class RentRollTest extends TestCase
{
    public function test_snap_to_monday_returns_midnight_monday_on_or_before(): void
    {
        $monday = RentRoll::snapToMonday(Carbon::parse('2026-06-17 14:30:00'));
        $this->assertTrue($monday->isMonday());
        $this->assertSame('00:00:00', $monday->format('H:i:s'));
        $this->assertTrue($monday->lessThanOrEqualTo(Carbon::parse('2026-06-17 14:30:00')));
        $this->assertLessThanOrEqual(6, (int) $monday->diffInDays(Carbon::parse('2026-06-17')));
    }

    public function test_week_columns_are_consecutive_mondays_with_labels(): void
    {
        $cols = RentRoll::weekColumns(Carbon::parse('2026-06-17'), 3);
        $this->assertCount(3, $cols);
        $first = Carbon::parse($cols[0]['start']);
        $this->assertTrue($first->isMonday());
        $this->assertSame($first->copy()->addWeek()->toDateString(), $cols[1]['start']);
        $this->assertSame($first->copy()->addWeeks(2)->toDateString(), $cols[2]['start']);
        $this->assertMatchesRegularExpression('/^WK \d{2} [A-Z][a-z]{2}$/', $cols[0]['label']);
    }

    public function test_status_strings(): void
    {
        $this->assertSame('Set weekly rent & utilities', RentRoll::status(0, 0));
        $this->assertSame('Paid up', RentRoll::status(390, 390));
        $this->assertSame('Underpaid — short $5,850.00', RentRoll::status(7020, 1170));
        $this->assertSame('Overpaid — credit $10.00', RentRoll::status(390, 400));
    }
}
