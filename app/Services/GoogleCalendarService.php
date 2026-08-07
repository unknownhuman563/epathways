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
use Google\Service\Calendar\FreeBusyRequest;
use Google\Service\Calendar\FreeBusyRequestItem;
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
        // Full calendar scope — covers event create + free/busy reads.
        $client->setScopes([Calendar::CALENDAR]);
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

        // Anchor the event to the timezone the client booked in, so the invite
        // is self-describing (same absolute instant, meaningful wall time).
        $tz = $booking->client_timezone ?: 'UTC';
        $start = Carbon::parse($booking->appointment_at)->setTimezone($tz);
        $duration = (int) config('services.google_calendar.default_duration', 30);
        $end = (clone $start)->addMinutes($duration > 0 ? $duration : 30);

        $name = trim(($booking->first_name ?? '').' '.($booking->last_name ?? '')) ?: 'Consultation';

        $event = new Event([
            'summary' => "Consultation with {$name}",
            'description' => $this->description($booking),
            'start' => new EventDateTime(['dateTime' => $start->toRfc3339String(), 'timeZone' => $tz]),
            'end' => new EventDateTime(['dateTime' => $end->toRfc3339String(), 'timeZone' => $tz]),
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

    /**
     * Move an existing booking's calendar event to its (new) appointment_at.
     * No-op when unconfigured or the booking has no event / no appointment.
     * Notifies attendees so the client's calendar + Meet invite update.
     */
    public function updateConsultationEvent(Booking $booking): void
    {
        if (! self::isConfigured() || empty($booking->google_event_id) || blank($booking->appointment_at)) {
            return;
        }

        $tz = $booking->client_timezone ?: 'UTC';
        $start = Carbon::parse($booking->appointment_at)->setTimezone($tz);
        $duration = (int) config('services.google_calendar.default_duration', 30);
        $end = (clone $start)->addMinutes($duration > 0 ? $duration : 30);
        $calId = (string) config('services.google_calendar.calendar_id', 'primary');

        try {
            $event = $this->calendar()->events->get($calId, $booking->google_event_id);
            $event->setStart(new EventDateTime(['dateTime' => $start->toRfc3339String(), 'timeZone' => $tz]));
            $event->setEnd(new EventDateTime(['dateTime' => $end->toRfc3339String(), 'timeZone' => $tz]));
            $this->calendar()->events->update($calId, $booking->google_event_id, $event, ['sendUpdates' => 'all']);

            Log::info('Booking calendar event moved', ['booking_id' => $booking->id]);
        } catch (\Throwable $e) {
            Log::error('Booking calendar event update failed', ['booking_id' => $booking->id, 'error' => $e->getMessage()]);
        }
    }

    /**
     * Delete a booking's calendar event (cancellation). Notifies attendees,
     * then clears the event id / Meet link off the booking. Idempotent.
     */
    public function cancelConsultationEvent(Booking $booking): void
    {
        if (self::isConfigured() && ! empty($booking->google_event_id)) {
            $calId = (string) config('services.google_calendar.calendar_id', 'primary');
            try {
                $this->calendar()->events->delete($calId, $booking->google_event_id, ['sendUpdates' => 'all']);
                Log::info('Booking calendar event cancelled', ['booking_id' => $booking->id]);
            } catch (\Throwable $e) {
                Log::error('Booking calendar event delete failed', ['booking_id' => $booking->id, 'error' => $e->getMessage()]);
            }
        }

        $booking->forceFill(['google_event_id' => null, 'meet_link' => null])->save();
    }

    /**
     * Busy intervals on the configured calendar between two instants, so the
     * booking page can hide already-taken slots. Returns [['start'=>ISO,
     * 'end'=>ISO], …]; empty when unconfigured or on any error (fail-open).
     */
    public function busyPeriods(Carbon $from, Carbon $to): array
    {
        if (! self::isConfigured()) {
            return [];
        }

        $calId = (string) config('services.google_calendar.calendar_id', 'primary');

        try {
            $request = new FreeBusyRequest([
                'timeMin' => $from->toRfc3339String(),
                'timeMax' => $to->toRfc3339String(),
                'items' => [new FreeBusyRequestItem(['id' => $calId])],
            ]);

            $result = $this->calendar()->freebusy->query($request);
            // The response keys calendars by their real id (e.g. the address),
            // not the 'primary' alias — so merge busy from every returned entry.
            $out = [];
            foreach (($result->getCalendars() ?? []) as $cal) {
                foreach (($cal->getBusy() ?? []) as $b) {
                    $out[] = ['start' => $b->getStart(), 'end' => $b->getEnd()];
                }
            }

            return $out;
        } catch (\Throwable $e) {
            Log::error('Calendar free/busy failed', ['error' => $e->getMessage()]);

            return [];
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
