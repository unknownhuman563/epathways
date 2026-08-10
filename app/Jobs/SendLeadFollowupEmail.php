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
 * Send a keyed message template to a lead — used for stage-triggered
 * follow-ups (e.g. the Contact Attempted "missed the call" sequence).
 *
 * Dispatch with a delay for a scheduled follow-up, or dispatchSync for an
 * immediate send. When $requireStatus is set the job no-ops unless the lead
 * is STILL on that stage at fire time, so a lead who has since progressed
 * doesn't get a stale follow-up.
 */
class SendLeadFollowupEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $leadId,
        public string $templateKey,
        public ?string $requireStatus = null,
    ) {}

    public function handle(): void
    {
        $lead = Lead::find($this->leadId);
        if (! $lead) {
            return;
        }

        // Skip if the lead has moved off the stage that scheduled this.
        if ($this->requireStatus !== null && $lead->status !== $this->requireStatus) {
            return;
        }

        self::sendKey($this->templateKey, $lead);
    }

    /**
     * Resolve a template by key across departments (shared first, else any
     * department that owns it) and send it. Non-fatal on failure.
     */
    public static function sendKey(string $key, Lead $lead): void
    {
        if (empty($lead->email)) {
            return;
        }

        try {
            $tpl = MessageTemplate::active()
                ->where('key', $key)
                ->orderByRaw("CASE WHEN department = '' THEN 0 ELSE 1 END")
                ->first();

            if ($tpl) {
                app(CommunicationService::class)->sendTemplate($tpl, $lead);
            }
        } catch (\Throwable $e) {
            Log::warning("Lead follow-up email '{$key}' failed", ['lead_id' => $lead->id, 'error' => $e->getMessage()]);
        }
    }
}
