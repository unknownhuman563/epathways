<?php

namespace App\Console\Commands;

use App\Jobs\SendCampaign;
use App\Models\EmailCampaign;
use Illuminate\Console\Command;

/**
 * Fires any scheduled bulk campaign whose time has arrived. Run every minute
 * by the scheduler (routes/console.php). Flips the campaign to 'sending'
 * immediately so a slow queue can't make it fire twice.
 */
class DispatchDueCampaigns extends Command
{
    protected $signature = 'campaigns:dispatch-due';

    protected $description = 'Dispatch scheduled bulk-email campaigns that are now due';

    public function handle(): int
    {
        $due = EmailCampaign::where('status', EmailCampaign::STATUS_SCHEDULED)
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now())
            ->get();

        foreach ($due as $campaign) {
            // Claim it before dispatching so a second tick can't re-queue it.
            $campaign->update(['status' => EmailCampaign::STATUS_SENDING]);
            SendCampaign::dispatch($campaign->id);
            $this->info("Dispatched campaign #{$campaign->id} ({$campaign->name}).");
        }

        $this->info("{$due->count()} due campaign(s) dispatched.");

        return self::SUCCESS;
    }
}
