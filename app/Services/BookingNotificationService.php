<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\BookingReminder;
use App\Models\MessageTemplate;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Booking confirmation + reminder emails. Owns the LazyMagnet-style template
 * variables and the schedule for booking_confirmation_1..5:
 *   1 — on booking (immediate)
 *   2 — one day before
 *   3 — day-of, ~8am client-local ("Happening Today")
 *   4 — one hour before
 *   5 — at the appointment time
 * Only future reminders are stored, so a same-day booking naturally skips the
 * earlier ones (e.g. a 6pm booking today keeps only 4 + 5).
 */
class BookingNotificationService
{
    public function __construct(private CommunicationService $comms) {}

    /** The dotted template variables the booking_confirmation_* templates use. */
    public function templateVars(Booking $booking): array
    {
        $lead = $booking->lead;
        $tz = $booking->client_timezone ?: config('app.timezone', 'UTC');
        $when = $booking->appointment_at
            ? Carbon::parse($booking->appointment_at)->setTimezone($tz)
            : null;
        $trackerUrl = $lead && $lead->tracking_code
            ? rtrim((string) config('app.url'), '/').'/track/'.$lead->tracking_code
            : rtrim((string) config('app.url'), '/');

        // Token-driven self-service links. Fall back to the tracker when a
        // booking predates the token column (shouldn't happen post-backfill).
        $rescheduleUrl = $booking->manage_token
            ? url('/booking/reschedule/'.$booking->manage_token)
            : $trackerUrl;
        $cancelUrl = $booking->manage_token
            ? url('/booking/cancel/'.$booking->manage_token)
            : $trackerUrl;

        return [
            'contact.email' => $booking->email,
            'appointment.only_start_date' => $when?->format('j M Y') ?? '',
            'appointment.start_time' => $when?->format('g:i A') ?? ($booking->appointment_time ?? ''),
            'appointment.timezone' => $tz,
            'appointment.meeting_location' => $booking->meet_link ?: 'Google Meet — link in your calendar invite',
            'tracker_url' => $trackerUrl,
            'reschedule_url' => $rescheduleUrl,
            'cancel_url' => $cancelUrl,
        ];
    }

    /** Resolve a booking_confirmation template by key (any department) and send it. */
    public function sendTemplateKey(Booking $booking, string $key): bool
    {
        $lead = $booking->lead;
        if (! $lead || blank($booking->email)) {
            return false;
        }

        $template = MessageTemplate::active()
            ->where('key', $key)
            ->get()
            ->sortBy(fn ($t) => $t->department === '' ? 0 : 1)
            ->first();
        if (! $template) {
            Log::warning('Booking email: no active template', ['key' => $key, 'booking_id' => $booking->id]);

            return false;
        }

        try {
            $this->comms->sendTemplate($template, $lead, $this->templateVars($booking));

            return true;
        } catch (\Throwable $e) {
            Log::error('Booking email send failed', ['key' => $key, 'booking_id' => $booking->id, 'error' => $e->getMessage()]);

            return false;
        }
    }

    /**
     * (Re)build the future reminder rows for a booking. Clears existing pending
     * ones first so it is safe to call again after a reschedule.
     */
    public function scheduleReminders(Booking $booking): void
    {
        if (blank($booking->appointment_at)) {
            return;
        }

        BookingReminder::where('booking_id', $booking->id)
            ->where('status', BookingReminder::STATUS_PENDING)
            ->delete();

        $tz = $booking->client_timezone ?: config('app.timezone', 'UTC');
        $appt = Carbon::parse($booking->appointment_at); // UTC instant
        $morning = (clone $appt)->setTimezone($tz)->startOfDay()->addHours(8)->setTimezone('UTC');

        $schedule = [
            'booking_confirmation_2' => (clone $appt)->subDay(),   // one day before
            'booking_confirmation_3' => $morning,                  // day-of, ~8am local
            'booking_confirmation_4' => (clone $appt)->subHour(),  // one hour before
            'booking_confirmation_5' => (clone $appt),             // at appointment time
        ];

        $now = now();
        foreach ($schedule as $key => $when) {
            // Only future reminders, never after the appointment itself.
            if ($when->greaterThan($now) && $when->lessThanOrEqualTo($appt)) {
                BookingReminder::create([
                    'booking_id' => $booking->id,
                    'template_key' => $key,
                    'send_at' => $when,
                    'status' => BookingReminder::STATUS_PENDING,
                ]);
            }
        }
    }

    /** Drop all still-pending reminders for a booking (cancel / cleanup). */
    public function cancelReminders(Booking $booking): void
    {
        BookingReminder::where('booking_id', $booking->id)
            ->where('status', BookingReminder::STATUS_PENDING)
            ->delete();
    }

    /**
     * A booking was missed: cancel the outstanding reminders and schedule the
     * missed_the_booking_2 follow-up for one day later.
     */
    public function scheduleMissedFollowup(Booking $booking): void
    {
        $this->cancelReminders($booking);

        BookingReminder::create([
            'booking_id' => $booking->id,
            'template_key' => 'missed_the_booking_2',
            'send_at' => now()->addDay(),
            'status' => BookingReminder::STATUS_PENDING,
        ]);
    }
}
