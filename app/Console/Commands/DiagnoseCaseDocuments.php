<?php

namespace App\Console\Commands;

use App\Models\Assessment;
use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\ResidentIntake;
use App\Services\Immigration\IntakeDocumentMigrator;
use Illuminate\Console\Command;

/**
 * Diagnose / recover a case whose visa-assessment uploads never made it into
 * the case profile. Resident intakes store uploaded files on the intake
 * (`document_files`); convert-to-case used not to copy them into LeadDocument
 * rows, so the Documents tab showed nothing.
 *
 *   php artisan case:docs Daniels Leano          # report only
 *   php artisan case:docs Daniels Leano --fix    # migrate intake uploads → case
 */
class DiagnoseCaseDocuments extends Command
{
    protected $signature = 'case:docs {query* : Name or email to search for}
        {--fix : Migrate the intake\'s uploaded files into the case\'s documents}';

    protected $description = 'Recover visa-assessment uploads missing from an immigration case profile';

    public function handle(): int
    {
        $q = trim(implode(' ', (array) $this->argument('query')));
        if ($q === '') {
            $this->error('Provide a name or email, e.g. php artisan case:docs Daniels Leano');

            return self::FAILURE;
        }

        $leads = Lead::query()
            ->where('first_name', 'like', "%{$q}%")
            ->orWhere('last_name', 'like', "%{$q}%")
            ->orWhere('email', 'like', "%{$q}%")
            ->get();

        if ($leads->isEmpty()) {
            $this->warn("No leads matched \"{$q}\".");

            return self::SUCCESS;
        }

        $cases = $leads->where('is_immigration_case', true);
        if ($cases->isEmpty()) {
            $this->warn('None of the matched leads is an immigration case.');
        }

        $anyToFix = false;

        foreach ($cases as $lead) {
            $onCase = LeadDocument::where('lead_id', $lead->id)->count();
            $this->line('');
            $this->info("Case #{$lead->id} {$lead->first_name} {$lead->last_name} ({$lead->email}) — {$onCase} document(s) on the case.");

            $intake = $this->resolveResidentIntake($lead);
            if (! $intake) {
                $this->line('  No resident intake with uploads is linked to this case.');
                continue;
            }

            $files = IntakeDocumentMigrator::fileCount($intake);
            $this->line("  Linked resident intake #{$intake->id} ({$intake->intake_id}) holds {$files} uploaded file(s).");

            if ($files === 0) {
                continue;
            }

            if ($this->option('fix')) {
                $created = IntakeDocumentMigrator::fromResidentIntake($intake, $lead);
                $this->info("  ✔ Migrated {$created} file(s) into case #{$lead->id}. Refresh the Documents tab.");
            } else {
                $anyToFix = true;
                $this->warn("  ⚠ These {$files} file(s) are NOT yet in the case Documents tab.");
            }
        }

        if ($anyToFix) {
            $this->line('');
            $this->line('Re-run with --fix to copy the intake uploads into the case documents.');
        }

        return self::SUCCESS;
    }

    /** Resolve the resident intake behind a case — via assessment link, else email + surname. */
    private function resolveResidentIntake(Lead $lead): ?ResidentIntake
    {
        if ($lead->assessment_id) {
            $a = Assessment::with('intakeable')->find($lead->assessment_id);
            if ($a && $a->intakeable instanceof ResidentIntake) {
                return $a->intakeable;
            }
        }

        if ($lead->email) {
            return ResidentIntake::where('email', $lead->email)
                ->when($lead->last_name, function ($qq) use ($lead) {
                    $qq->whereRaw('LOWER(TRIM(last_name)) = ?', [strtolower(trim((string) $lead->last_name))]);
                })
                ->latest('id')
                ->first();
        }

        return null;
    }
}
