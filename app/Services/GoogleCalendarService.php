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
        $tz = $this->canonicalTimezone($booking->client_timezone);
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
            $calendarId = (string) config('services.google_calendar.calendar_id', 'primary');
            $created = $this->calendar()->events->insert(
                $calendarId,
                $event,
                ['conferenceDataVersion' => 1, 'sendUpdates' => 'all'],
            );

            // The Meet conference is created ASYNCHRONOUSLY: the insert response
            // usually comes back with conferenceData.status = 'pending' and NO
            // link yet. Re-GET the event once to pick up the resolved link, and
            // read it from conferenceData.entryPoints (not just the legacy
            // hangoutLink), so the Meet URL isn't lost to a too-early read.
            $meet = $this->extractMeetLink($created);
            $status = optional(optional(optional($created->getConferenceData())->getCreateRequest())->getStatus())->getStatusCode();
            if (blank($meet)) {
                try {
                    $refetched = $this->calendar()->events->get($calendarId, $created->getId(), ['conferenceDataVersion' => 1]);
                    $meet = $this->extractMeetLink($refetched);
                    $status = optional(optional(optional($refetched->getConferenceData())->getCreateRequest())->getStatus())->getStatusCode() ?: $status;
                } catch (\Throwable $e) {
                    Log::warning('Booking Meet re-fetch failed', ['booking_id' => $booking->id, 'error' => $e->getMessage()]);
                }
            }

            $booking->google_event_id = $created->getId();
            $booking->meet_link = $meet;
            $booking->save();

            Log::info('Booking calendar event created', [
                'booking_id' => $booking->id, 'event_id' => $created->getId(),
                'meet' => (bool) $meet, 'conference_status' => $status,
            ]);
        } catch (\Throwable $e) {
            Log::error('Booking calendar event failed', ['booking_id' => $booking->id, 'error' => $e->getMessage()]);
        }
    }

    /**
     * Normalise a client-supplied IANA timezone to a name Google Calendar
     * accepts. Browsers/devices can report DEPRECATED aliases (e.g.
     * "Asia/Calcutta", "Europe/Kiev") which PHP tolerates but the Calendar API
     * rejects ("Unknown or bad timezone") — failing the whole event insert.
     * ICU's canonical id maps them (Asia/Calcutta -> Asia/Kolkata). Empty or
     * still-invalid values fall back to the booking default.
     */
    private function canonicalTimezone(?string $tz): string
    {
        $tz = trim((string) $tz);
        $fallback = (string) config('services.booking.timezone', 'Pacific/Auckland');

        if ($tz === '') {
            return $fallback;
        }

        // Explicit map of deprecated IANA aliases PHP accepts but Google
        // Calendar rejects. This is the reliable path (works without the intl
        // extension, which prod may not have). Asia/Calcutta -> Asia/Kolkata is
        // the common one (India). Extend as new ones surface in the logs.
        static $aliases = [
            'Asia/Calcutta' => 'Asia/Kolkata',
            'Asia/Rangoon' => 'Asia/Yangon',
            'Asia/Saigon' => 'Asia/Ho_Chi_Minh',
            'Asia/Katmandu' => 'Asia/Kathmandu',
            'Asia/Dacca' => 'Asia/Dhaka',
            'Asia/Thimbu' => 'Asia/Thimphu',
            'Asia/Ashkhabad' => 'Asia/Ashgabat',
            'Asia/Ujung_Pandang' => 'Asia/Makassar',
            'Asia/Macao' => 'Asia/Macau',
            'Asia/Chongqing' => 'Asia/Shanghai',
            'Asia/Harbin' => 'Asia/Shanghai',
            'Asia/Kashgar' => 'Asia/Urumqi',
            'Asia/Istanbul' => 'Europe/Istanbul',
            'Europe/Kiev' => 'Europe/Kyiv',
            'Europe/Uzhgorod' => 'Europe/Kyiv',
            'Europe/Zaporozhye' => 'Europe/Kyiv',
            'Europe/Nicosia' => 'Asia/Nicosia',
            'America/Godthab' => 'America/Nuuk',
            'America/Buenos_Aires' => 'America/Argentina/Buenos_Aires',
            'Pacific/Enderbury' => 'Pacific/Kanton',
            'Australia/Currie' => 'Australia/Hobart',
        ];
        if (isset($aliases[$tz])) {
            $tz = $aliases[$tz];
        } elseif (class_exists(\IntlTimeZone::class)) {
            // Generic canonicalisation for anything not in the map.
            $canonical = \IntlTimeZone::getCanonicalID($tz);
            if (is_string($canonical) && $canonical !== '' && $canonical !== 'Etc/Unknown') {
                $tz = $canonical;
            }
        }

        try {
            new \DateTimeZone($tz);

            return $tz;
        } catch (\Throwable $e) {
            return $fallback;
        }
    }

    /**
     * Pull the Google Meet URL from an event, preferring the newer
     * conferenceData.entryPoints (video) and falling back to the legacy
     * hangoutLink. Returns null when the conference isn't ready yet.
     */
    private function extractMeetLink(Event $event): ?string
    {
        $link = $event->getHangoutLink();
        if (filled($link)) {
            return $link;
        }
        $conf = $event->getConferenceData();
        foreach ((array) (optional($conf)->getEntryPoints() ?? []) as $ep) {
            if ($ep->getEntryPointType() === 'video' && filled($ep->getUri())) {
                return $ep->getUri();
            }
        }

        return null;
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

        $tz = $this->canonicalTimezone($booking->client_timezone);
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
     * Delete a booking's calendar event, then clear the event id / Meet link.
     * Idempotent. $notify=true emails attendees the cancellation (client-facing
     * Cancel flow); pass false for a silent admin delete (no email).
     */
    public function cancelConsultationEvent(Booking $booking, bool $notify = true): void
    {
        if (self::isConfigured() && ! empty($booking->google_event_id)) {
            $calId = (string) config('services.google_calendar.calendar_id', 'primary');
            try {
                $this->calendar()->events->delete($calId, $booking->google_event_id, ['sendUpdates' => $notify ? 'all' : 'none']);
                Log::info('Booking calendar event deleted', ['booking_id' => $booking->id, 'notified' => $notify]);
            } catch (\Throwable $e) {
                Log::error('Booking calendar event delete failed', ['booking_id' => $booking->id, 'error' => $e->getMessage()]);
            }
        }

        // Skip the save when the row is about to be deleted anyway.
        if ($booking->exists) {
            $booking->forceFill(['google_event_id' => null, 'meet_link' => null])->save();
        }
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
        $lines = [];

        // Emma's bookings lead with her personal intro + contact details, then
        // the booking summary. Other consultants keep the plain summary.
        if (trim((string) $booking->consultant_name) === 'Emma Ceballo') {
            $lines[] = self::EMMA_INTRO;
            $lines[] = '';
        }

        $lines[] = 'ePathways consultation booking.';
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

    /** Emma Ceballo's intro + contact block for the calendar event description. */
    private const EMMA_INTRO = "Hi, I'm Emma Ceballo from ePathways New Zealand. 🇳🇿 Thank you for your interest in ePathways! We're excited to help you achieve your dream of studying, working, and building a new life in New Zealand.\n\nYou can also contact me directly via:\n\n📞 Phone: +64 21 227 8000\n💬 WhatsApp: +64 21 227 8000\n📧 Email: emma@epathways.co.nz\n\nI'm looking forward to helping you explore the right pathway to New Zealand! 🇳🇿✨";
}
