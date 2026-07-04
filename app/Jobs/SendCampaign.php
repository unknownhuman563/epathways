<?php

namespace App\Jobs;

use App\Models\EmailCampaign;
use App\Models\Lead;
use App\Services\CommunicationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Sends one bulk-email campaign: marks it sending, queues a personalised email
 * for each snapshot recipient (logged against the campaign), tallies
 * sent/failed, and marks the campaign sent. Each per-recipient email is itself
 * queued by CommunicationService, so this job just fans them out.
 */
class SendCampaign implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 600;

    public function __construct(public int $campaignId) {}

    public function handle(CommunicationService $comms): void
    {
        $campaign = EmailCampaign::find($this->campaignId);
        if (! $campaign || in_array($campaign->status, [EmailCampaign::STATUS_SENT, EmailCampaign::STATUS_CANCELED], true)) {
            return;
        }

        $campaign->update(['status' => EmailCampaign::STATUS_SENDING, 'started_at' => now()]);

        $sent = 0;
        $failed = 0;
        $isSms = $campaign->channel === EmailCampaign::CHANNEL_SMS;

        foreach (array_chunk($campaign->recipient_lead_ids ?? [], 200) as $chunk) {
            $leads = Lead::whereIn('id', $chunk)->get();
            foreach ($leads as $lead) {
                $ok = $isSms
                    ? $comms->sendCampaignSms($lead, $campaign->body, $campaign->id)
                    : $comms->sendCampaignEmail($lead, $campaign->subject, $campaign->body, $campaign->id);
                $ok ? $sent++ : $failed++;
            }
        }

        $campaign->update([
            'status' => $failed > 0 && $sent === 0 ? EmailCampaign::STATUS_FAILED : EmailCampaign::STATUS_SENT,
            'sent_count' => $sent,
            'failed_count' => $failed,
            'completed_at' => now(),
        ]);

        Log::info('Bulk campaign dispatched', ['campaign_id' => $campaign->id, 'sent' => $sent, 'failed' => $failed]);
    }
}
