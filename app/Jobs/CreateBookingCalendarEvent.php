<?php

namespace App\Jobs;

use App\Models\Booking;
use App\Services\GoogleCalendarService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Best-effort: create the Google Calendar event + Meet link for a consultation
 * booking. No-op unless Calendar delegation is configured. Idempotent — the
 * service skips a booking that already has an event id.
 */
class CreateBookingCalendarEvent implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 60;

    public function __construct(public int $bookingId) {}

    public function handle(GoogleCalendarService $calendar): void
    {
        if (! GoogleCalendarService::isConfigured()) {
            return;
        }

        $booking = Booking::find($this->bookingId);
        if (! $booking) {
            return;
        }

        $calendar->createConsultationEvent($booking);
    }
}
