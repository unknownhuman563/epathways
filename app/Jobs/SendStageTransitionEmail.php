<?php

namespace App\Jobs;

use App\Models\Lead;
use App\Models\MessageTemplate;
use App\Services\CommunicationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Sends the automatic email tied to a pipeline stage when a lead MOVES INTO
 * that stage (see config/stage_emails.php for the stage => template-key map).
 *
 * Dispatched with a short delay from wherever a lead's `status` is changed by
 * staff. The delay + the re-check in handle() form a debounce: if the lead is
 * moved on again before the delay elapses, the stale email is skipped, so a
 * mis-click that's corrected quickly never reaches the client.
 */
class SendStageTransitionEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 120;

    public function __construct(
        public int $leadId,
        public string $stage,
        public string $templateKey,
    ) {}

    /**
     * Queue the stage email only for a real transition into a mapped stage.
     * Safe to call unconditionally after any status write — it self-filters.
     */
    public static function maybeDispatch(Lead $lead, ?string $old, ?string $new): void
    {
        if (blank($new) || $old === $new || blank($lead->email)) {
            return;
        }

        $key = config('stage_emails.map')[$new] ?? null;
        if (! $key) {
            return;
        }

        self::dispatch($lead->id, $new, $key)
            ->delay(now()->addSeconds((int) config('stage_emails.delay_seconds', 60)));
    }

    public function handle(CommunicationService $comms): void
    {
        $lead = Lead::find($this->leadId);
        if (! $lead || blank($lead->email)) {
            return;
        }

        // Debounce: the lead was moved on (or back) during the delay window —
        // this email is for a stage the lead is no longer in. Skip it.
        if ($lead->status !== $this->stage) {
            Log::info('Stage email skipped — lead moved during delay window', [
                'lead_id' => $lead->id, 'queued_for' => $this->stage, 'now' => $lead->status,
            ]);

            return;
        }

        // Resolve by immutable key regardless of which department owns the row
        // (these templates were authored under 'sales' / shared, and may later
        // get an education-owned copy). Prefer education, then shared, then any.
        $template = MessageTemplate::active()
            ->where('key', $this->templateKey)
            ->get()
            ->sortBy(fn (MessageTemplate $t) => match ($t->department) {
                'education' => 0,
                '', null => 1,
                default => 2,
            })
            ->first();

        if (! $template) {
            Log::warning('Stage email: no active template for key', [
                'lead_id' => $lead->id, 'key' => $this->templateKey,
            ]);

            return;
        }

        $comms->sendTemplate($template, $lead);

        Log::info('Stage transition email sent', [
            'lead_id' => $lead->id, 'stage' => $this->stage,
            'template' => $this->templateKey, 'template_id' => $template->id,
        ]);
    }
}
