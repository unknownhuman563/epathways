<?php

namespace App\Console\Commands;

use App\Jobs\SendScheduledEventEmail;
use App\Models\ScheduledEventEmail;
use Illuminate\Console\Command;

/**
 * Fires any scheduled event email whose time has arrived. Run every minute by
 * the scheduler (routes/console.php). Claims each ('sending') before
 * dispatching so a second tick can't re-queue it.
 */
class DispatchDueEventEmails extends Command
{
    protected $signature = 'events:dispatch-due-emails';

    protected $description = 'Dispatch scheduled event emails that are now due';

    public function handle(): int
    {
        $due = ScheduledEventEmail::where('status', ScheduledEventEmail::STATUS_PENDING)
            ->where('scheduled_at', '<=', now())
            ->get();

        foreach ($due as $scheduled) {
            $scheduled->update(['status' => ScheduledEventEmail::STATUS_SENDING]);
            SendScheduledEventEmail::dispatch($scheduled->id);
            $this->info("Dispatched scheduled event email #{$scheduled->id}.");
        }

        $this->info("{$due->count()} due event email(s) dispatched.");

        return self::SUCCESS;
    }
}
