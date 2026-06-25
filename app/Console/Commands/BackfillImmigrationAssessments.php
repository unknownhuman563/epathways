<?php

namespace App\Console\Commands;

use App\Models\Assessment;
use App\Support\IntakeVisaTypeMap;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Backfill Assessment rows for historical intake submissions that were
 * created before Phase A (when Assessment creation was commented out in
 * the four intake controllers). Idempotent — re-running it is a no-op
 * because Assessment::createForIntake skips intakes that already have a
 * paired row.
 *
 * Usage:
 *   php artisan immigration:backfill-assessments
 *   php artisan immigration:backfill-assessments --dry-run
 */
class BackfillImmigrationAssessments extends Command
{
    protected $signature = 'immigration:backfill-assessments {--dry-run : Report what would happen without writing anything}';

    protected $description = 'Create Assessment rows for any historical visa-interest intake submissions that don\'t already have one.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        if ($dryRun) {
            $this->warn('DRY RUN — no rows will be written.');
        }

        $totals = [
            'created' => 0,
            'skipped' => 0,
            'missing_visa_type' => 0,
        ];

        foreach (IntakeVisaTypeMap::intakeClasses() as $intakeClass) {
            $label  = IntakeVisaTypeMap::label($intakeClass);
            $visaType = IntakeVisaTypeMap::resolve($intakeClass);

            if (! $visaType) {
                $this->warn("  · {$label} — VisaType not seeded; logging warning and skipping all rows.");
                Log::warning('Backfill: VisaType not found for intake class', [
                    'intake_class' => $intakeClass,
                ]);
                // Still walk the table so the "skipped" count reflects
                // historical rows that can't be paired without seeding.
                $count = $intakeClass::query()->count();
                $totals['missing_visa_type'] += $count;
                continue;
            }

            $this->line("");
            $this->info("→ {$label} ({$intakeClass})");

            $created = 0;
            $skipped = 0;

            // chunkById keeps memory predictable on large tables.
            $intakeClass::query()->orderBy('id')->chunkById(200, function ($intakes) use ($visaType, $dryRun, &$created, &$skipped) {
                foreach ($intakes as $intake) {
                    $exists = Assessment::query()
                        ->where('intakeable_type', $intake::class)
                        ->where('intakeable_id', $intake->id)
                        ->exists();

                    if ($exists) {
                        $skipped++;
                        continue;
                    }

                    if ($dryRun) {
                        $created++;
                        continue;
                    }

                    $assessment = Assessment::createForIntake($intake, $visaType);
                    if ($assessment) {
                        $created++;
                    } else {
                        $skipped++;
                    }
                }
            });

            $this->line("  Created: {$created}, Skipped (already paired): {$skipped}");
            $totals['created'] += $created;
            $totals['skipped'] += $skipped;
        }

        $this->line("");
        $this->info("──────────────────────────────────────────");
        if ($dryRun) {
            $this->info("DRY RUN: would have created {$totals['created']} new Assessment record(s), {$totals['skipped']} already exist.");
        } else {
            $this->info("Created {$totals['created']} new Assessment record(s), skipped {$totals['skipped']} existing.");
        }
        if ($totals['missing_visa_type'] > 0) {
            $this->warn("  {$totals['missing_visa_type']} intake row(s) couldn't be paired because their VisaType isn't seeded — re-run after seeding.");
        }

        return self::SUCCESS;
    }
}
