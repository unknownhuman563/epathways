<?php

namespace App\Console\Commands;

use App\Models\Lead;
use App\Models\LeadDocument;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Repair an engagement pack that was accidentally re-generated after the client
 * had already signed. A second generation creates a fresh UNSIGNED copy of the
 * Written Agreement (so the pack shows one extra document and flips to "Sent"),
 * and it overwrites the stored agreement fee with the new figure.
 *
 * This command anchors on the SIGNED Written Agreement (the real one) and:
 *   - deletes every UNSIGNED Written Agreement copy (the shadow duplicates),
 *   - realigns the remaining supporting documents' created-at / author to the
 *     signed agreement, so the "Created" column shows the original generation,
 *   - restores the agreement fee (--fee), and
 *   - leaves the signed document and its signature completely untouched.
 *
 * Dry-run by default — nothing is written until you pass --apply.
 *
 *   php artisan immigration:repair-engagement paspe0110@gmail.com --fee=2350
 *   php artisan immigration:repair-engagement paspe0110@gmail.com --fee=2350 --apply
 *   php artisan immigration:repair-engagement 42 --fee=2350 --apply
 */
class RepairEngagement extends Command
{
    protected $signature = 'immigration:repair-engagement
        {lead : Lead id, email, or name to repair}
        {--fee= : Restore the (ex-GST) agreement fee to this amount}
        {--apply : Actually write the changes (otherwise dry-run)}';

    protected $description = 'Undo an accidental engagement re-generation, restoring the signed pack, its fee and created-at';

    private const DISK = 'local';

    public function handle(): int
    {
        $key = (string) $this->argument('lead');

        $lead = Lead::where('id', is_numeric($key) ? (int) $key : 0)
            ->orWhere('email', $key)
            ->orWhere('engagement_signing_token', 'like', $key.'%')
            ->orWhereRaw("CONCAT(first_name,' ',last_name) LIKE ?", ['%'.$key.'%'])
            ->first();

        if (! $lead) {
            $this->error("No lead matched \"{$key}\".");

            return self::FAILURE;
        }

        $apply = (bool) $this->option('apply');
        $this->info(($apply ? 'APPLYING' : 'DRY-RUN')." — Lead #{$lead->id}: {$lead->first_name} {$lead->last_name} <{$lead->email}>");
        $this->line("  Current stored fee: ".($lead->engagement_fee_total ?? '(none)')." | sent_at: ".($lead->engagement_sent_at ?? '(null)'));

        $docs = LeadDocument::where('lead_id', $lead->id)
            ->where('source_variant', 'like', 'engagement:%')
            ->orderBy('created_at')
            ->get();

        if ($docs->isEmpty()) {
            $this->warn('  No engagement documents on this lead — nothing to repair.');

            return self::SUCCESS;
        }

        $this->line('  Engagement documents found:');
        foreach ($docs as $d) {
            $this->line(sprintf('    #%-5d %-32s signed=%-3s created=%s by=%s',
                $d->id, $d->source_variant, $d->client_signed_at ? 'yes' : 'no',
                $d->created_at, optional($d->uploader)->name ?? '?'));
        }

        // Anchor on the earliest SIGNED Written Agreement — the original, real one.
        $signedWa = $docs->first(fn ($d) => $d->source_variant === 'engagement:written_agreement' && $d->client_signed_at);

        if (! $signedWa) {
            $this->warn('  No SIGNED Written Agreement here — this is not the accidental-regeneration case, so nothing was changed.');

            return self::SUCCESS;
        }

        $this->line("  Anchor (original signed agreement): #{$signedWa->id}, created {$signedWa->created_at} by ".(optional($signedWa->uploader)->name ?? '?'));

        // Shadow copies to delete: UNSIGNED Written Agreements only.
        $shadows = $docs->filter(fn ($d) => $d->source_variant === 'engagement:written_agreement' && ! $d->client_signed_at);

        // Supporting docs to keep but realign to the original generation.
        $supporting = $docs->filter(fn ($d) => $d->source_variant !== 'engagement:written_agreement');

        $fee = $this->option('fee');

        $this->newLine();
        $this->line('  Planned changes:');
        foreach ($shadows as $s) {
            $this->line("    - DELETE unsigned duplicate #{$s->id} ({$s->source_variant})");
        }
        foreach ($supporting as $s) {
            if ($s->created_at != $signedWa->created_at || $s->uploaded_by != $signedWa->uploaded_by) {
                $this->line("    - REALIGN #{$s->id} created-at/author → {$signedWa->created_at} / ".(optional($signedWa->uploader)->name ?? '?'));
            }
        }
        if ($fee !== null && $fee !== '') {
            $this->line("    - SET agreement fee → {$fee}");
        }
        $this->line("    - KEEP signed agreement #{$signedWa->id} and its signature untouched");

        if (! $apply) {
            $this->newLine();
            $this->comment('  Dry-run only. Re-run with --apply to make these changes.');

            return self::SUCCESS;
        }

        // Apply.
        foreach ($shadows as $s) {
            if ($s->file_path && Storage::disk(self::DISK)->exists($s->file_path)) {
                Storage::disk(self::DISK)->delete($s->file_path);
            }
            $s->delete();
        }

        foreach ($supporting as $s) {
            $s->forceFill([
                'created_at' => $signedWa->created_at,
                'uploaded_by' => $signedWa->uploaded_by,
            ])->save();
        }

        if ($fee !== null && $fee !== '') {
            $lead->forceFill(['engagement_fee_total' => (float) $fee])->save();
        }

        $this->newLine();
        $this->info('  Done. The pack now reflects the original signed agreement.');

        return self::SUCCESS;
    }
}
