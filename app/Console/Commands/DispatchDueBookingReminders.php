<?php

namespace App\Console\Commands;

use App\Jobs\SendBookingReminder;
use App\Models\BookingReminder;
use Illuminate\Console\Command;

/**
 * Dispatches any booking reminder whose send time has arrived. Run every minute
 * by the scheduler (routes/console.php). Claims each ('sending') before
 * dispatching so a second tick can't re-queue it.
 */
class DispatchDueBookingReminders extends Command
{
    protected $signature = 'bookings:dispatch-due-reminders';

    protected $description = 'Dispatch booking reminder emails that are now due';

    public function handle(): int
    {
        $due = BookingReminder::where('status', BookingReminder::STATUS_PENDING)
            ->where('send_at', '<=', now())
            ->get();

        foreach ($due as $reminder) {
            $reminder->update(['status' => BookingReminder::STATUS_SENDING]);
            SendBookingReminder::dispatch($reminder->id);
        }

        $this->info("{$due->count()} due booking reminder(s) dispatched.");

        return self::SUCCESS;
    }
}
