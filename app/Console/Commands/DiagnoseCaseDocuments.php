<?php

namespace App\Console\Commands;

use App\Models\Assessment;
use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\ResidentIntake;
use App\Services\Immigration\IntakeDocumentMigrator;
use Illuminate\Console\Command;

/**
 * Diagnose / recover a case whose applicant uploads never made it into the
 * case profile's Documents tab. Two legacy upload paths never created
 * LeadDocument rows: resident-intake `document_files`, and the Lead's
 * `education_notes.uploaded_files` (free-assessment / enrolment uploads).
 *
 *   php artisan case:docs Daniels          # report only
 *   php artisan case:docs Daniels --fix    # migrate uploads into the case docs
 */
class DiagnoseCaseDocuments extends Command
{
    protected $signature = 'case:docs {query?* : Name or email to search for (omit with --all)}
        {--all : Scan every immigration case (including archived) instead of a name}
        {--fix : Migrate the applicant\'s uploaded files into the case\'s documents}';

    protected $description = 'Recover applicant uploads missing from an immigration case profile';

    public function handle(): int
    {
        // Bulk mode — every case, including archived. Otherwise, name/email search.
        if ($this->option('all')) {
            $cases = Lead::where('is_immigration_case', true)->orderBy('id')->get();
            $this->info("Scanning {$cases->count()} immigration case(s)...");
        } else {
            $q = trim(implode(' ', (array) $this->argument('query')));
            if ($q === '') {
                $this->error('Provide a name/email, or use --all. e.g. php artisan case:docs Daniels');

                return self::FAILURE;
            }

            // Match each whitespace-separated term against name/email so a full
            // "First Last" query still resolves (each field holds only one part).
            $terms = preg_split('/\s+/', $q);
            $leads = Lead::query()
                ->where(function ($outer) use ($terms) {
                    foreach ($terms as $t) {
                        $outer->orWhere('first_name', 'like', "%{$t}%")
                            ->orWhere('last_name', 'like', "%{$t}%")
                            ->orWhere('email', 'like', "%{$t}%");
                    }
                })
                ->get();

            if ($leads->isEmpty()) {
                $this->warn("No leads matched \"{$q}\".");

                return self::SUCCESS;
            }

            $cases = $leads->where('is_immigration_case', true);
            if ($cases->isEmpty()) {
                $this->warn('None of the matched leads is an immigration case.');
            }
        }

        $pending = false;
        $casesWithFiles = 0;
        $totalMigrated = 0;

        $bulk = $this->option('all');

        foreach ($cases as $lead) {
            $intake = $this->resolveResidentIntake($lead);
            $intakeFiles = $intake ? IntakeDocumentMigrator::residentFileCount($intake) : 0;
            $leadFiles = IntakeDocumentMigrator::leadUploadCount($lead);
            $recoverable = $intakeFiles + $leadFiles;

            // In bulk mode, only surface cases that actually have missing files.
            if ($bulk && $recoverable === 0) {
                continue;
            }

            $onCase = LeadDocument::where('lead_id', $lead->id)->count();
            $this->line('');
            $this->info("Case #{$lead->id} {$lead->first_name} {$lead->last_name} ({$lead->email}) — {$onCase} document(s) on the case.");
            if ($intake) {
                $this->line("  Resident intake #{$intake->id} ({$intake->intake_id}) holds {$intakeFiles} uploaded file(s).");
            }
            if ($leadFiles > 0) {
                $this->line("  Lead record holds {$leadFiles} enrolment/assessment upload(s) not yet in the case docs.");
            }

            if ($recoverable === 0) {
                $this->line('  No recoverable uploads found on the intake or the lead record.');
                continue;
            }

            $casesWithFiles++;

            if ($this->option('fix')) {
                $created = ($intake ? IntakeDocumentMigrator::fromResidentIntake($intake, $lead) : 0)
                    + IntakeDocumentMigrator::fromLeadUploads($lead);
                $totalMigrated += $created;
                $this->info("  ✔ Migrated {$created} file(s) into case #{$lead->id}.");
            } else {
                $pending = true;
                $this->warn("  ⚠ {$recoverable} file(s) can be recovered into the case Documents tab.");
            }
        }

        $this->line('');
        if ($this->option('fix')) {
            $this->info("Done. {$casesWithFiles} case(s) had recoverable uploads; migrated {$totalMigrated} file(s) total. Refresh the Documents tab(s).");
        } elseif ($pending) {
            $this->line("{$casesWithFiles} case(s) have recoverable uploads. Re-run with --fix to copy them into the case documents.");
        } else {
            $this->info('No cases with recoverable uploads found.');
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
