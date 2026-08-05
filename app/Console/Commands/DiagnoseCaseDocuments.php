<?php

namespace App\Console\Commands;

use App\Models\Lead;
use App\Models\LeadDocument;
use Illuminate\Console\Command;

/**
 * Diagnostic for "a client's documents disappeared from their case profile".
 * Finds every Lead row matching a name/email and shows which row holds the
 * uploaded documents versus which row is the immigration case — the common
 * cause is documents attached to a different Lead row than the case.
 *
 *   php artisan case:docs Daniel
 *   php artisan case:docs daniel@example.com --fix   (re-point docs to the case)
 */
class DiagnoseCaseDocuments extends Command
{
    protected $signature = 'case:docs {query : Name or email to search for}
        {--fix : Re-point documents from duplicate lead rows onto the immigration case row}';

    protected $description = 'Show where a client\'s documents live vs. their immigration case row';

    public function handle(): int
    {
        $q = trim($this->argument('query'));
        if ($q === '') {
            $this->error('Provide a name or email, e.g. php artisan case:docs Daniel');

            return self::FAILURE;
        }

        $leads = Lead::query()
            ->where('first_name', 'like', "%{$q}%")
            ->orWhere('last_name', 'like', "%{$q}%")
            ->orWhere('email', 'like', "%{$q}%")
            ->get(['id', 'lead_id', 'first_name', 'last_name', 'email', 'is_immigration_case']);

        if ($leads->isEmpty()) {
            $this->warn("No leads matched \"{$q}\".");

            return self::SUCCESS;
        }

        $rows = $leads->map(function (Lead $l) {
            $count = LeadDocument::where('lead_id', $l->id)->count();

            return [
                'id' => $l->id,
                'ref' => $l->lead_id,
                'name' => trim("{$l->first_name} {$l->last_name}"),
                'email' => $l->email,
                'case?' => $l->is_immigration_case ? 'YES' : '—',
                'docs' => $count,
            ];
        });

        $this->table(['Lead id', 'Ref', 'Name', 'Email', 'Case?', 'Docs'], $rows);

        // Identify the case row(s) and any rows that hold documents.
        $cases = $leads->where('is_immigration_case', true);
        $withDocs = $rows->filter(fn ($r) => $r['docs'] > 0);

        if ($cases->isEmpty()) {
            $this->warn('None of these rows is flagged as an immigration case.');
        }

        foreach ($cases as $case) {
            $onCase = LeadDocument::where('lead_id', $case->id)->count();
            $elsewhere = $withDocs->where('id', '!=', $case->id);
            $this->line('');
            $this->info("Case: #{$case->id} {$case->first_name} {$case->last_name} ({$case->email}) — {$onCase} document(s) on the case row.");

            if ($elsewhere->isNotEmpty()) {
                foreach ($elsewhere as $r) {
                    $this->warn("  ⚠ {$r['docs']} document(s) sit on lead #{$r['id']} ({$r['name']} / {$r['email']}) — NOT the case row. These won't show in the case profile.");
                }

                if ($this->option('fix')) {
                    $sameEmail = $elsewhere->filter(fn ($r) => strtolower(trim((string) $r['email'])) === strtolower(trim((string) $case->email)) && $case->email);
                    $moved = 0;
                    foreach ($sameEmail as $r) {
                        $moved += LeadDocument::where('lead_id', $r['id'])->update(['lead_id' => $case->id]);
                    }
                    $this->info("  ✔ Re-pointed {$moved} document(s) (same email) onto case #{$case->id}. Refresh the case profile.");
                } else {
                    $this->line('  Run again with --fix to move the same-email documents onto the case row.');
                }
            }
        }

        return self::SUCCESS;
    }
}
