<?php

namespace App\Console\Commands;

use App\Models\LeadDocument;
use App\Services\GoogleDriveService;
use Illuminate\Console\Command;

/**
 * One-shot backfill: pushes every APPROVED LeadDocument into its client's
 * Google Drive folder. Needed because documents approved before Drive was
 * configured had their background job run and no-op, and those jobs never
 * retry. Idempotent — skips anything already synced (has a gdrive_file_id),
 * so it's safe to run repeatedly and never duplicates a file in Drive.
 */
class SyncApprovedDocumentsToDrive extends Command
{
    protected $signature = 'gdrive:sync-approved
        {--all : Re-sync every approved document, including ones already in Drive}';

    protected $description = 'Push approved client documents into Google Drive (backfill for the pre-configuration backlog)';

    public function handle(GoogleDriveService $drive): int
    {
        if (! GoogleDriveService::isConfigured()) {
            $this->error('Google Drive is not configured (key file and/or shared drive id missing). Nothing to do.');

            return self::FAILURE;
        }

        $query = LeadDocument::with('lead')
            ->where('status', LeadDocument::STATUS_APPROVED);

        if (! $this->option('all')) {
            // Default: only documents not yet in Drive.
            $query->whereNull('gdrive_file_id');
        }

        $total = (clone $query)->count();

        if ($total === 0) {
            $this->info('No approved documents need syncing. All caught up.');

            return self::SUCCESS;
        }

        $this->info("Syncing {$total} approved document(s) to Google Drive...");
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $synced = 0;
        $failed = 0;
        $failures = [];

        $query->orderBy('id')->chunkById(50, function ($docs) use ($drive, &$synced, &$failed, &$failures, $bar) {
            foreach ($docs as $doc) {
                try {
                    $drive->syncApprovedDocument($doc);
                    $synced++;
                } catch (\Throwable $e) {
                    $failed++;
                    $failures[] = "  #{$doc->id} ({$doc->original_name}): {$e->getMessage()}";
                }
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);

        $this->info("Done. Synced: {$synced}  Failed: {$failed}");

        if ($failed > 0) {
            $this->warn('Failures:');
            foreach ($failures as $line) {
                $this->line($line);
            }

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
