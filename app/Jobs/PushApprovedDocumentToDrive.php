<?php

namespace App\Jobs;

use App\Models\LeadDocument;
use App\Services\GoogleDriveService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Uploads a single APPROVED LeadDocument into its client's Google Drive
 * folder. Dispatched from the approve paths; a best-effort background task so
 * a Drive hiccup never blocks staff. No-ops entirely when Google Drive isn't
 * configured, so it's safe to dispatch always.
 *
 * Carries the id (not the model) so it always works on fresh data and re-runs
 * cleanly. Idempotent via the doc's stored gdrive_file_id.
 */
class PushApprovedDocumentToDrive implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Give the Drive API a few attempts across transient errors. */
    public int $tries = 3;

    /** Back off 30s, then 2m, then 5m between attempts. */
    public array $backoff = [30, 120, 300];

    public function __construct(public int $documentId) {}

    public function handle(GoogleDriveService $drive): void
    {
        if (! GoogleDriveService::isConfigured()) {
            return; // dormant until credentials are in place
        }

        $doc = LeadDocument::with('lead')->find($this->documentId);
        if (! $doc || $doc->status !== LeadDocument::STATUS_APPROVED) {
            // Deleted, or un-approved before the job ran — nothing to sync.
            return;
        }

        $drive->syncApprovedDocument($doc);
    }

    public function failed(\Throwable $e): void
    {
        Log::error('PushApprovedDocumentToDrive failed', [
            'document_id' => $this->documentId,
            'error' => $e->getMessage(),
        ]);
    }
}
