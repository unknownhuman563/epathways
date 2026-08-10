<?php

namespace App\Jobs;

use App\Models\BookingReminder;
use App\Services\BookingNotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Sends one due booking reminder (booking_confirmation_2..5). Skips anything no
 * longer 'sending' (double-claim guard) and cancels reminders for a cancelled
 * booking rather than emailing.
 */
class SendBookingReminder implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 60;

    public function __construct(public int $reminderId) {}

    public function handle(BookingNotificationService $notifier): void
    {
        $reminder = BookingReminder::with('booking.lead')->find($this->reminderId);
        if (! $reminder || $reminder->status !== BookingReminder::STATUS_SENDING) {
            return;
        }

        $booking = $reminder->booking;
        if (! $booking) {
            $reminder->update(['status' => BookingReminder::STATUS_FAILED]);

            return;
        }

        // Don't remind a cancelled booking.
        if (in_array(strtolower((string) $booking->status), ['cancelled', 'canceled'], true)) {
            $reminder->update(['status' => BookingReminder::STATUS_CANCELED]);

            return;
        }

        $ok = $notifier->sendTemplateKey($booking, $reminder->template_key);

        $reminder->update([
            'status' => $ok ? BookingReminder::STATUS_SENT : BookingReminder::STATUS_FAILED,
            'sent_at' => now(),
        ]);
    }
}
