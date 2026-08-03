<?php

namespace App\Services;

use App\Models\Booking;
use Google\Client as GoogleClient;
use Google\Service\Calendar;
use Google\Service\Calendar\ConferenceData;
use Google\Service\Calendar\ConferenceSolutionKey;
use Google\Service\Calendar\CreateConferenceRequest;
use Google\Service\Calendar\Event;
use Google\Service\Calendar\EventAttendee;
use Google\Service\Calendar\EventDateTime;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Creates a Google Calendar event with an auto-generated Google Meet link for a
 * consultation booking, on a Workspace calendar. Uses the SAME service account
 * as GoogleDriveService with domain-wide delegation (impersonating the
 * configured user). Dormant until both the key file and `impersonate` are set.
 */
class GoogleCalendarService
{
    public static function isConfigured(): bool
    {
        $keyFile = self::keyFilePath();

        return $keyFile !== null
            && is_file($keyFile)
            && ! blank(config('services.google_calendar.impersonate'));
    }

    private static function keyFilePath(): ?string
    {
        $path = config('services.google_calendar.key_file');
        if (blank($path)) {
            return null;
        }

        // Allow a repo-relative path (e.g. storage/app/google/sa.json).
        return str_starts_with($path, '/') || preg_match('/^[A-Za-z]:\\\\/', $path)
            ? $path
            : base_path($path);
    }

    private function calendar(): Calendar
    {
        $client = new GoogleClient;
        $client->setAuthConfig(self::keyFilePath());
        $client->setScopes([Calendar::CALENDAR_EVENTS]);
        // Domain-wide delegation: act as this Workspace user so the event lands
        // on their calendar and a Meet link can be generated.
        $client->setSubject((string) config('services.google_calendar.impersonate'));

        return new Calendar($client);
    }

    /**
     * Create (once) the calendar event + Meet link for a booking, storing the
     * event id and Meet URL back on the booking. Idempotent: a booking that
     * already has a google_event_id is skipped.
     */
    public function createConsultationEvent(Booking $booking): void
    {
        if (! self::isConfigured()) {
            return;
        }
        if (! empty($booking->google_event_id)) {
            return; // already created
        }
        if (blank($booking->appointment_at) || blank($booking->email)) {
            return; // nothing to schedule
        }

        $start = Carbon::parse($booking->appointment_at);
        $duration = (int) config('services.google_calendar.default_duration', 30);
        $end = (clone $start)->addMinutes($duration > 0 ? $duration : 30);

        $name = trim(($booking->first_name ?? '').' '.($booking->last_name ?? '')) ?: 'Consultation';

        $event = new Event([
            'summary' => "Consultation with {$name}",
            'description' => $this->description($booking),
            'start' => new EventDateTime(['dateTime' => $start->toRfc3339String(), 'timeZone' => 'UTC']),
            'end' => new EventDateTime(['dateTime' => $end->toRfc3339String(), 'timeZone' => 'UTC']),
            'attendees' => array_values(array_filter([
                new EventAttendee(['email' => $booking->email]),
            ])),
        ]);

        // Request an auto Google Meet conference on the event.
        $conference = new ConferenceData;
        $req = new CreateConferenceRequest;
        $req->setRequestId('booking-'.$booking->id.'-'.substr(md5((string) $booking->created_at), 0, 8));
        $req->setConferenceSolutionKey(new ConferenceSolutionKey(['type' => 'hangoutsMeet']));
        $conference->setCreateRequest($req);
        $event->setConferenceData($conference);

        try {
            $created = $this->calendar()->events->insert(
                (string) config('services.google_calendar.calendar_id', 'primary'),
                $event,
                ['conferenceDataVersion' => 1, 'sendUpdates' => 'all'],
            );

            $booking->google_event_id = $created->getId();
            $booking->meet_link = $created->getHangoutLink();
            $booking->save();

            Log::info('Booking calendar event created', [
                'booking_id' => $booking->id, 'event_id' => $created->getId(), 'meet' => (bool) $created->getHangoutLink(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Booking calendar event failed', ['booking_id' => $booking->id, 'error' => $e->getMessage()]);
        }
    }

    private function description(Booking $booking): string
    {
        $lines = ['ePathways consultation booking.'];
        if ($booking->service_type) {
            $lines[] = 'Service: '.$booking->service_type;
        }
        if ($booking->consultant_name) {
            $lines[] = 'Consultant: '.$booking->consultant_name;
        }
        if ($booking->phone) {
            $lines[] = 'Phone: '.$booking->phone;
        }
        if ($booking->message) {
            $lines[] = "\n".$booking->message;
        }

        return implode("\n", $lines);
    }
}
