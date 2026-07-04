<?php

namespace App\Jobs;

use App\Models\MessageTemplate;
use App\Models\ScheduledEventEmail;
use App\Services\EventEmailSender;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Fires one due scheduled event email: sends it to its snapshot recipients via
 * the shared EventEmailSender, tallies sent/failed, and marks it sent (or
 * failed if nothing went out). Skips anything no longer pending.
 */
class SendScheduledEventEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;

    public function __construct(public int $scheduledEmailId) {}

    public function handle(EventEmailSender $sender): void
    {
        $scheduled = ScheduledEventEmail::with('event')->find($this->scheduledEmailId);
        // Skip only once finished/canceled — a 'sending' claim from the
        // dispatcher still needs to go out.
        if (! $scheduled || in_array($scheduled->status, [ScheduledEventEmail::STATUS_SENT, ScheduledEventEmail::STATUS_CANCELED], true)) {
            return;
        }

        if (! $scheduled->event) {
            $scheduled->update(['status' => ScheduledEventEmail::STATUS_FAILED, 'sent_at' => now()]);

            return;
        }

        $template = $scheduled->template_id ? MessageTemplate::find($scheduled->template_id) : null;

        $result = $sender->send(
            $scheduled->event,
            $scheduled->recipient_ids ?? [],
            $scheduled->subject,
            $scheduled->body,
            $template,
        );

        $scheduled->update([
            'status' => ($result['sent'] === 0 && $result['failed'] > 0)
                ? ScheduledEventEmail::STATUS_FAILED
                : ScheduledEventEmail::STATUS_SENT,
            'sent_count' => $result['sent'],
            'failed_count' => $result['failed'],
            'sent_at' => now(),
        ]);

        Log::info('Scheduled event email dispatched', [
            'scheduled_email_id' => $scheduled->id,
            'sent' => $result['sent'], 'failed' => $result['failed'],
        ]);
    }
}
