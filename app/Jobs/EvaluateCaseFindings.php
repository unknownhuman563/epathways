<?php

namespace App\Jobs;

use App\Models\Lead;
use App\Services\Immigration\CaseFindingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Build 12 phase 3 — evaluate a case's findings off the request path.
 *
 * Dispatched on document upload, stage change and nightly — never on page load,
 * so two people opening the same case a minute apart see the same stored result
 * rather than a slow, non-deterministic re-run. Carries the lead id so it always
 * works on fresh data; the service is idempotent (dedup on finding_key).
 */
class EvaluateCaseFindings implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;

    public function __construct(public int $leadId) {}

    public function handle(CaseFindingService $service): void
    {
        $lead = Lead::find($this->leadId);

        // Findings are a case concept only — silently no-op for non-cases.
        if (! $lead || ! $lead->is_immigration_case) {
            return;
        }

        try {
            $service->evaluate($lead);
        } catch (\Throwable $e) {
            Log::error('Case findings evaluation failed', ['lead_id' => $this->leadId, 'error' => $e->getMessage()]);
            throw $e;
        }
    }
}
