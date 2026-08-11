<?php

namespace App\Console\Commands;

use App\Jobs\EvaluateCaseFindings;
use App\Models\Lead;
use Illuminate\Console\Command;

/**
 * Build 12 phase 3 — nightly sweep. Queues a findings evaluation for every
 * immigration case so the panel reflects time-based rules (unanswered document
 * requests, no-contact ageing, passport expiry) even on cases nobody touched
 * that day. Per-case work runs on the queue, not inline.
 */
class EvaluateCaseFindingsCommand extends Command
{
    protected $signature = 'immigration:evaluate-findings';

    protected $description = 'Queue a findings evaluation for every immigration case (Build 12 phase 3)';

    public function handle(): int
    {
        $count = 0;

        Lead::immigrationCase()
            ->select('id')
            ->chunkById(200, function ($cases) use (&$count) {
                foreach ($cases as $case) {
                    EvaluateCaseFindings::dispatch($case->id);
                    $count++;
                }
            });

        $this->info("Queued findings evaluation for {$count} case(s).");

        return self::SUCCESS;
    }
}
