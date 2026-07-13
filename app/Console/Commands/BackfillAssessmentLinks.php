<?php

namespace App\Console\Commands;

use App\Models\Assessment;
use App\Models\Lead;
use Illuminate\Console\Command;

/**
 * Backfills leads.assessment_id for immigration cases that were converted
 * before the FK existed. Matches by applicant email, preferring the
 * assessment whose intake name matches the case — email alone is ambiguous
 * when applicants share one (a parent registering several people), which is
 * what caused case profiles to show the wrong person's intake.
 *
 * Idempotent: only touches cases whose assessment_id is still null. Run
 * with --dry to preview.
 */
class BackfillAssessmentLinks extends Command
{
    protected $signature = 'immigration:backfill-assessment-links {--dry : Preview without writing}';

    protected $description = 'Link already-converted immigration cases to the exact Assessment they came from';

    public function handle(): int
    {
        $leads = Lead::query()
            ->where('is_immigration_case', true)
            ->whereNull('assessment_id')
            ->whereNotNull('email')
            ->get();

        $linked = 0;
        $ambiguous = 0;
        $skipped = 0;

        foreach ($leads as $lead) {
            $candidates = Assessment::where('applicant_email', $lead->email)
                ->whereNotNull('intakeable_type')
                ->latest('id')
                ->get();

            if ($candidates->isEmpty()) {
                $skipped++;

                continue;
            }

            $wantLast = strtolower(trim((string) $lead->last_name));
            $wantFirst = strtolower(trim((string) $lead->first_name));

            $match = $candidates->first(function ($a) use ($wantLast, $wantFirst) {
                $i = $a->intakeable;
                if (! $i) {
                    return false;
                }
                $iLast = strtolower(trim((string) ($i->last_name ?? $i->family_name ?? '')));
                $iFirst = strtolower(trim((string) ($i->first_name ?? '')));

                return $wantLast !== '' && $iLast === $wantLast && ($wantFirst === '' || $iFirst === $wantFirst);
            });

            // No confident name match but several assessments share the email
            // — flag rather than guess, so a human can check the ambiguous one.
            if (! $match) {
                if ($candidates->count() > 1) {
                    $ambiguous++;
                    $this->warn("Ambiguous: case {$lead->lead_id} ({$lead->first_name} {$lead->last_name}) has {$candidates->count()} same-email assessments and no name match — skipped.");

                    continue;
                }
                $match = $candidates->first();
            }

            $this->line("Link {$lead->lead_id} ({$lead->first_name} {$lead->last_name}) → assessment #{$match->id}");

            if (! $this->option('dry')) {
                $lead->assessment_id = $match->id;
                $lead->save();
            }

            $linked++;
        }

        $verb = $this->option('dry') ? 'Would link' : 'Linked';
        $this->info("{$verb} {$linked} case(s) · {$ambiguous} ambiguous (skipped) · {$skipped} with no assessment.");

        return self::SUCCESS;
    }
}
