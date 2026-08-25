<?php

namespace Tests\Feature\Booking;

use App\Services\GoogleCalendarService;
use Tests\TestCase;

/**
 * Client timezones must be canonicalised before going to Google Calendar —
 * deprecated IANA aliases (e.g. Asia/Calcutta) are accepted by PHP but rejected
 * by the Calendar API ("Unknown or bad timezone"), which failed the whole
 * event insert so bookings never reached the calendar.
 */
class CalendarTimezoneTest extends TestCase
{
    private function canon(?string $tz): string
    {
        $svc = app(GoogleCalendarService::class);
        $m = new \ReflectionMethod($svc, 'canonicalTimezone');
        $m->setAccessible(true);

        return $m->invoke($svc, $tz);
    }

    public function test_deprecated_aliases_are_mapped(): void
    {
        $this->assertSame('Asia/Kolkata', $this->canon('Asia/Calcutta'));
        $this->assertSame('Europe/Kyiv', $this->canon('Europe/Kiev'));
        $this->assertSame('Asia/Ho_Chi_Minh', $this->canon('Asia/Saigon'));
    }

    public function test_valid_zone_passes_through(): void
    {
        $this->assertSame('Asia/Manila', $this->canon('Asia/Manila'));
        $this->assertSame('Pacific/Auckland', $this->canon('Pacific/Auckland'));
    }

    public function test_empty_or_invalid_falls_back_to_default(): void
    {
        $this->assertSame('Pacific/Auckland', $this->canon(''));
        $this->assertSame('Pacific/Auckland', $this->canon(null));
        $this->assertSame('Pacific/Auckland', $this->canon('Not/AZone'));
    }
}
