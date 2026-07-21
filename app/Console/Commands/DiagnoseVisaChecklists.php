<?php

namespace App\Console\Commands;

use App\Models\Lead;
use App\Models\VisaType;
use App\Services\Immigration\CaseChecklistService;
use Illuminate\Console\Command;

/**
 * Read-only diagnostic for the "tracker shows a different checklist than the
 * staff dashboard" bug.
 *
 * Root cause: the tracker used to resolve the visa with a single
 * `where(name) OR where(code)` query. Once any visa's `code` equalled a
 * different visa's `name`, that query could match either row and the
 * database was free to pick — so some cases rendered another visa's
 * checklist. The staff dashboard matched on `name` only, hence the
 * disagreement.
 *
 * This command reports the colliding rows and every case that was affected.
 * It changes nothing.
 */
class DiagnoseVisaChecklists extends Command
{
    protected $signature = 'immigration:diagnose-checklists';

    protected $description = 'Report visa code/name collisions and cases whose tracker checklist disagreed with the staff dashboard';

    public function handle(CaseChecklistService $checklist): int
    {
        $this->info('== 1. Visa code / name collisions ==');

        $visas = VisaType::get(['id', 'code', 'name']);
        $byName = $visas->keyBy(fn ($v) => strtolower(trim((string) $v->name)));

        $collisions = [];
        foreach ($visas as $v) {
            $code = strtolower(trim((string) $v->code));
            if ($code === '') {
                continue;
            }
            $clash = $byName->get($code);
            if ($clash && $clash->id !== $v->id) {
                $collisions[] = [$v->id, $v->name, $v->code, $clash->id, $clash->name];
            }
        }

        if (empty($collisions)) {
            $this->line('  None. (Then the mismatch came from somewhere else — see section 2.)');
        } else {
            $this->table(
                ['visa id', 'visa name', 'its code', 'collides with id', 'that visa\'s name'],
                $collisions
            );
            $this->warn('  Each row: this visa\'s CODE equals another visa\'s NAME — that is what confused the old query.');
        }

        $this->newLine();
        $this->info('== 2. Cases where the tracker resolved a different visa than staff ==');

        $affected = [];
        $cases = Lead::immigrationCase()->whereNotNull('inz_visa_type')->get();

        foreach ($cases as $lead) {
            // What the OLD tracker query would have returned.
            $old = VisaType::query()
                ->where('name', $lead->inz_visa_type)
                ->orWhere('code', $lead->inz_visa_type)
                ->first();

            // What both sides resolve to now.
            $new = $checklist->resolveVisaType($lead);

            if ($old && $new && $old->id !== $new->id) {
                $affected[] = [
                    $lead->id,
                    trim("{$lead->first_name} {$lead->last_name}"),
                    $lead->inz_visa_type,
                    "#{$old->id} {$old->name}",
                    "#{$new->id} {$new->name}",
                ];
            }
        }

        if (empty($affected)) {
            $this->line('  None — every case now resolves the same visa on both sides.');
        } else {
            $this->table(
                ['case id', 'name', 'case visa', 'tracker showed (before)', 'correct visa (now)'],
                $affected
            );
            $this->warn('  '.count($affected).' case(s) were showing the wrong checklist on the tracker. The code fix corrects them — no data change needed.');
        }

        $this->newLine();
        $this->info('Scanned '.$cases->count().' immigration case(s) against '.$visas->count().' visa type(s).');
        $this->line('This command is read-only; nothing was modified.');

        return self::SUCCESS;
    }
}
