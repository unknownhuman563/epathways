<?php

namespace App\Console\Commands;

use App\Models\Assessment;
use App\Models\Lead;
use Illuminate\Console\Command;

/**
 * Backfills leads.assessment_id for immigration cases that were converted
 * before the FK existed. Emails aren't unique to a person (a parent often
 * registers several people under one email), which caused case profiles to
 * show the wrong person's intake, so matching is name-aware:
 *
 *   1. Same applicant email AND matching name.
 *   2. Unique name match (covers staff-created cases with no email on them).
 *
 * Idempotent — only touches cases whose assessment_id is still null. Run
 * with --dry to preview. Ambiguous cases are listed and skipped.
 */
class BackfillAssessmentLinks extends Command
{
    protected $signature = 'immigration:backfill-assessment-links {--dry : Preview without writing}';

    protected $description = 'Link already-converted immigration cases to the exact Assessment they came from';

    public function handle(): int
    {
        // Index every assessment (with its intake) by email and by name once.
        $assessments = Assessment::whereNotNull('intakeable_type')->with('intakeable')->latest('id')->get();
        $byEmail = [];
        $byName = [];
        foreach ($assessments as $a) {
            $i = $a->intakeable;
            if (! $i) {
                continue;
            }
            $first = strtolower(trim((string) ($i->first_name ?? '')));
            $last = strtolower(trim((string) ($i->last_name ?? $i->family_name ?? '')));
            $em = strtolower(trim((string) ($a->applicant_email ?: ($i->email ?? ''))));
            if ($em !== '') {
                $byEmail[$em][] = $a;
            }
            if ($first !== '' || $last !== '') {
                $byName["{$first}|{$last}"][] = $a;
            }
        }

        $leads = Lead::query()
            ->where('is_immigration_case', true)
            ->whereNull('assessment_id')
            ->get();

        $linked = 0;
        $ambiguous = 0;
        $none = 0;

        foreach ($leads as $lead) {
            $wantFirst = strtolower(trim((string) $lead->first_name));
            $wantLast = strtolower(trim((string) $lead->last_name));
            $email = strtolower(trim((string) $lead->email));
            $match = null;
            $how = '';

            // 1. Email + matching last name.
            if ($email !== '' && ! empty($byEmail[$email])) {
                foreach ($byEmail[$email] as $a) {
                    $i = $a->intakeable;
                    $iLast = strtolower(trim((string) ($i->last_name ?? $i->family_name ?? '')));
                    if ($wantLast !== '' && $iLast === $wantLast) {
                        $match = $a;
                        $how = 'email+name';
                        break;
                    }
                }
            }

            // 2. Unique full-name match (staff cases with no email).
            if (! $match && $wantFirst !== '' && $wantLast !== '') {
                $named = $byName["{$wantFirst}|{$wantLast}"] ?? [];
                if (count($named) === 1) {
                    $match = $named[0];
                    $how = 'name';
                } elseif (count($named) > 1) {
                    $ambiguous++;
                    $this->warn("Ambiguous: case {$lead->lead_id} ({$lead->first_name} {$lead->last_name}) matches ".count($named).' assessments by name — skipped.');

                    continue;
                }
            }

            if (! $match) {
                $none++;

                continue;
            }

            $this->line("Link {$lead->lead_id} ({$lead->first_name} {$lead->last_name}) → assessment #{$match->id} [{$how}]");

            if (! $this->option('dry')) {
                $lead->assessment_id = $match->id;
                $lead->save();
            }

            $linked++;
        }

        $verb = $this->option('dry') ? 'Would link' : 'Linked';
        $this->info("{$verb} {$linked} case(s) · {$ambiguous} ambiguous (skipped) · {$none} with no match.");

        return self::SUCCESS;
    }
}
