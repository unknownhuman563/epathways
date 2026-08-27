<?php

namespace App\Console\Commands;

use App\Models\Lead;
use App\Models\LeadProposal;
use App\Models\Program;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Restore a lead's program proposal from a list of program TITLES, resolving
 * the ids on whatever database this runs against (ids differ between local and
 * prod, titles don't). Used to recover a proposal that was overwritten before
 * version history existed — e.g. Haseeb's original five programs on prod.
 *
 * The lead's CURRENT active proposal is snapshotted into history first (so it
 * isn't lost either), the restored set becomes the active shortlist, and a
 * version row is written for it. Idempotent-ish: re-running with the same set
 * won't duplicate the active version.
 *
 *   php artisan proposals:restore REG-6A7FF8A465D0B \
 *     "Bachelor of Information Technology" "Bachelor of Nursing" \
 *     "Bachelor of Applied Management" "Bachelor of Software Engineering" \
 *     "Bachelor of Accounting" --dry-run
 */
class RestoreLeadProposal extends Command
{
    protected $signature = 'proposals:restore {lead : Lead lead_id (e.g. REG-XXXX) or email} {titles* : Program titles in the order they should appear} {--selected= : Title of the program to mark as chosen on this proposal} {--reset : Delete existing proposal history for this lead first (clean rebuild)} {--dry-run : Resolve and report without writing}';

    protected $description = "Restore a lead's proposal shortlist from program titles (recovers a proposal overwritten before version history). Run once per version, oldest first, to rebuild a full history.";

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');

        $key = (string) $this->argument('lead');
        $lead = Lead::where('lead_id', $key)->orWhere('email', $key)->first();
        if (! $lead) {
            $this->error("Lead not found for '{$key}' (tried lead_id and email).");

            return self::FAILURE;
        }

        // Resolve each title -> program id on THIS database. Exact,
        // case-insensitive title match. Ambiguous or missing titles abort so
        // we never silently restore the wrong programs.
        $ids = [];
        $failed = false;
        foreach ($this->argument('titles') as $title) {
            $matches = Program::whereRaw('LOWER(title) = ?', [mb_strtolower(trim($title))])->get(['id', 'title', 'level', 'location']);
            if ($matches->isEmpty()) {
                $this->error("  ✗ no program titled: {$title}");
                $failed = true;

                continue;
            }
            if ($matches->count() > 1) {
                $this->error("  ✗ ambiguous title '{$title}' — {$matches->count()} matches:");
                foreach ($matches as $m) {
                    $this->line("      [{$m->id}] {$m->title} · Level {$m->level} · {$m->location}");
                }
                $failed = true;

                continue;
            }
            $p = $matches->first();
            $ids[] = $p->id;
            $this->line("  ✓ [{$p->id}] {$p->title} · Level {$p->level} · {$p->location}");
        }

        if ($failed) {
            $this->error('Aborting — resolve the titles above (fix spelling, or the programs are missing on this DB).');

            return self::FAILURE;
        }

        $ids = array_values(array_unique($ids));

        // Optional selected program — must be one of the restored set.
        $selectedId = null;
        if ($sel = $this->option('selected')) {
            $match = Program::whereRaw('LOWER(title) = ?', [mb_strtolower(trim($sel))])->first();
            if (! $match) {
                $this->error("--selected: no program titled '{$sel}'.");

                return self::FAILURE;
            }
            if (! in_array($match->id, $ids, true)) {
                $this->error("--selected: '{$match->title}' is not in the restored set.");

                return self::FAILURE;
            }
            $selectedId = $match->id;
        }

        $current = is_array($lead->proposed_program_ids) ? array_map('intval', $lead->proposed_program_ids) : [];
        $this->newLine();
        $this->info("Lead {$lead->lead_id} ({$lead->email})");
        $this->line('  current active : '.(empty($current) ? '(none)' : implode(', ', $current)));
        $this->line('  restore to     : '.implode(', ', $ids));
        if ($selectedId) {
            $this->line("  selected       : {$selectedId}");
        }
        if ($this->option('reset')) {
            $this->line('  reset          : existing history will be DELETED first');
        }

        if ($dry) {
            $this->newLine();
            $this->warn('[dry-run] nothing written.');

            return self::SUCCESS;
        }

        DB::transaction(function () use ($lead, $ids, $selectedId) {
            // Clean rebuild: wipe history + the active shortlist/selection so a
            // fresh, correctly-ordered sequence can be laid down.
            if ($this->option('reset')) {
                $lead->proposals()->delete();
                $lead->forceFill([
                    'proposed_program_ids' => null,
                    'preferred_program_id' => null,
                    'preferred_program_chosen_at' => null,
                ])->save();
                $lead->refresh();
            }

            // Legacy safety (non-reset): snapshot a pre-existing active proposal
            // into history if it isn't captured yet, so it isn't discarded.
            if (! empty($lead->proposed_program_ids) && ! $lead->proposals()->exists()) {
                LeadProposal::create([
                    'lead_id' => $lead->id,
                    'program_ids' => array_values(array_map('intval', $lead->proposed_program_ids)),
                    'created_by' => null,
                ]);
            }

            // Supersede: a new/different active freezes the current selection
            // onto the version being replaced, then starts unselected — same
            // rule as saveProposal.
            $latest = $lead->proposals()->first();
            $latestIds = $latest ? array_values(array_map('intval', $latest->program_ids ?? [])) : null;
            $isNew = $latestIds !== $ids;
            if ($isNew) {
                if ($latest && $lead->preferred_program_id) {
                    $latest->update(['selected_program_id' => (int) $lead->preferred_program_id]);
                }
                $lead->preferred_program_id = null;
                $lead->preferred_program_chosen_at = null;
            }

            $lead->proposed_program_ids = $ids;
            $lead->save();

            if ($isNew) {
                LeadProposal::create([
                    'lead_id' => $lead->id,
                    'program_ids' => $ids,
                    'created_by' => null,
                ]);
            }

            // Mark the chosen program on this (now-active) proposal, if given.
            if ($selectedId) {
                $lead->forceFill([
                    'preferred_program_id' => $selectedId,
                    'preferred_program_chosen_at' => now(),
                ])->save();
            }
        });

        $this->newLine();
        $this->info("Restored {$lead->lead_id}: ".count($ids).' programs set as the active proposal ('.$lead->proposals()->count().' version(s) in history).');

        return self::SUCCESS;
    }
}
