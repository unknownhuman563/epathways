<?php

namespace App\Console\Commands;

use App\Models\AiRecordAnalysis;
use Illuminate\Console\Command;

/**
 * Housekeeping: drop AI analyses whose cache window expired over a week ago.
 * The freshest non-expired row is what the badge serves, so anything well
 * past expiry is dead weight. Scheduled daily (routes/console.php).
 */
class AiCleanupExpiredAnalyses extends Command
{
    protected $signature = 'ai:cleanup-expired';

    protected $description = 'Delete AI record analyses that expired more than 7 days ago';

    public function handle(): int
    {
        $count = AiRecordAnalysis::query()
            ->where('expires_at', '<', now()->subDays(7))
            ->delete();

        $this->info("Deleted {$count} expired analyses.");

        return self::SUCCESS;
    }
}
