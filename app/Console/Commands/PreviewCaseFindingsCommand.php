<?php

namespace App\Console\Commands;

use App\Models\Lead;
use App\Services\Immigration\CaseFindingService;
use Illuminate\Console\Command;

/**
 * Build 12 phase 3 — read-only count check. Runs the rules against a sample of
 * real cases WITHOUT persisting, and reports the finding count per case plus the
 * total/average. The point is to see whether the numbers are in a range where
 * staff will actually read the panel — rule noise is the failure mode. Nothing
 * is written; safe to run on production.
 */
class PreviewCaseFindingsCommand extends Command
{
    protected $signature = 'immigration:findings-preview {--limit=15 : How many recent cases to sample}';

    protected $description = 'Preview findings counts across real cases without persisting (Build 12 phase 3)';

    public function handle(CaseFindingService $service): int
    {
        $limit = max(1, (int) $this->option('limit'));

        $cases = Lead::immigrationCase()
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get(['id', 'lead_id', 'first_name', 'last_name', 'inz_visa_type']);

        if ($cases->isEmpty()) {
            $this->warn('No immigration cases found.');

            return self::SUCCESS;
        }

        $rows = [];
        $counts = [];
        foreach ($cases as $case) {
            $p = $service->preview($case);
            $counts[] = $p['open'];
            $rows[] = [
                $case->lead_id,
                trim("{$case->first_name} {$case->last_name}") ?: '—',
                $case->inz_visa_type ?: '—',
                $p['open'],
            ];
        }

        $this->table(['Case', 'Name', 'Visa', 'Open findings'], $rows);

        $total = array_sum($counts);
        $avg = round($total / count($counts), 1);
        $max = max($counts);
        $this->newLine();
        $this->info("Sample of {$cases->count()} case(s): {$total} findings total, {$avg} average, {$max} max.");
        $this->line('If a typical case is more than a handful, tune config/immigration.php before staff form the habit of ignoring the panel.');

        return self::SUCCESS;
    }
}
