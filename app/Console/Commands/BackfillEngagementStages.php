<?php

namespace App\Console\Commands;

use App\Models\Lead;
use App\Models\LeadDocument;
use Illuminate\Console\Command;

/**
 * One-off reconcile for cases whose engagement was generated / signed BEFORE
 * the automatic stage transitions were added. Advances each immigration case to
 * the stage its engagement state implies:
 *   - a signed Written Agreement            → "Agreement Signed"
 *   - a generated (unsigned) Written Agreement → "For Agreement & Invoice"
 * Only moves a case from an early stage (never downgrades an advanced one).
 */
class BackfillEngagementStages extends Command
{
    protected $signature = 'immigration:backfill-engagement-stages {--apply : Write the changes (otherwise dry-run)}';

    protected $description = 'Set the immigration stage from each case\'s engagement (generated / signed) state.';

    private const GEN_FROM = ['For Assessment', 'Endorsed', 'Agreement Sent'];

    private const SIGN_FROM = ['For Assessment', 'Endorsed', 'Agreement Sent', 'For Agreement & Invoice', 'Request for Information'];

    public function handle(): int
    {
        $apply = (bool) $this->option('apply');

        // Cases that have a Written Agreement in their engagement pack.
        $leadIds = LeadDocument::where('source_variant', 'engagement:written_agreement')
            ->distinct()->pluck('lead_id');

        $moved = 0;
        $skipped = 0;

        foreach (Lead::whereIn('id', $leadIds)->where('is_immigration_case', true)->get() as $lead) {
            $signed = LeadDocument::where('lead_id', $lead->id)
                ->where('source_variant', 'engagement:written_agreement')
                ->whereNotNull('client_signed_at')
                ->exists();

            [$to, $from] = $signed
                ? ['Agreement Signed', self::SIGN_FROM]
                : ['For Agreement & Invoice', self::GEN_FROM];

            $current = $lead->immigration_stage;
            $eligible = $current === null || in_array($current, $from, true);

            if (! $eligible || $current === $to) {
                $skipped++;

                continue;
            }

            $this->line(sprintf('  #%d %s: %s → %s', $lead->id, $lead->lead_id, $current ?: '(unset)', $to));

            if ($apply) {
                $lead->advanceImmigrationStage($to, $from, null);
                \App\Jobs\EvaluateCaseFindings::dispatch($lead->id);
            }
            $moved++;
        }

        $this->info(($apply ? 'Updated ' : 'Would update ')."{$moved} case(s); left {$skipped} unchanged.");
        if (! $apply) {
            $this->comment('Dry run — re-run with --apply to write the changes.');
        }

        return self::SUCCESS;
    }
}
