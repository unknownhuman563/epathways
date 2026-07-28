<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * One-off production migration: move client tracker-uploaded documents out of
 * the world-readable public disk (storage/app/public) onto the private disk
 * (storage/app/private), closing a Privacy-Act exposure where anyone with the
 * URL could open a client's passport / bank statement without logging in.
 *
 * File-centric on purpose — it scans every file under public/lead-documents,
 * so it also relocates any orphan not referenced by a LeadDocument row.
 *
 * Strict three-phase discipline (never reordered):
 *   1. copy   — public file → identical path on private, only if missing there
 *   2. verify — byte-for-byte (size + sha256) on both disks
 *   3. purge  — delete the public original ONLY for files that verified
 *
 * Default run does copy + verify and touches nothing on public. Deleting the
 * originals requires the explicit --purge flag, and even then a file is purged
 * only when its private copy is confirmed present and identical.
 *
 *   php artisan documents:privatize            # copy + verify, no delete
 *   php artisan documents:privatize --dry-run  # report only, no writes
 *   php artisan documents:privatize --purge    # copy + verify + delete verified originals
 */
class PrivatizeDocuments extends Command
{
    protected $signature = 'documents:privatize
        {--dry-run : Report what would happen without writing or deleting anything}
        {--purge : After verifying, delete the public originals that copied identically}
        {--path=lead-documents : Public-disk subdirectory to migrate}';

    protected $description = 'Copy client uploads from the public disk to the private disk (verify, then optionally purge the originals).';

    public function handle(): int
    {
        $dir = trim((string) $this->option('path'), '/');
        $dry = (bool) $this->option('dry-run');
        $purge = (bool) $this->option('purge');

        $public = Storage::disk('public');
        $local = Storage::disk('local');

        $files = $public->allFiles($dir);

        if (empty($files)) {
            $this->info("Nothing to migrate — no files under public/{$dir}.");

            return self::SUCCESS;
        }

        $this->info(($dry ? '[DRY RUN] ' : '').'Scanning '.count($files)." file(s) under public/{$dir}");
        if ($purge && ! $dry) {
            $this->warn('--purge is ON: verified public originals WILL be deleted after copy.');
        }

        $copied = $skippedPresent = $verifiedOk = $verifyFail = $purged = 0;
        $failures = [];

        foreach ($files as $path) {
            // ── copy (only if the private copy is missing) ──
            if ($local->exists($path)) {
                $skippedPresent++;
            } elseif ($dry) {
                $this->line("  would copy  {$path}");
                $copied++;
            } else {
                // Stream the copy so large files don't balloon memory.
                $stream = $public->readStream($path);
                $local->writeStream($path, $stream);
                if (is_resource($stream)) {
                    fclose($stream);
                }
                $copied++;
            }

            // ── verify (skip in dry-run when the copy hasn't actually happened) ──
            if ($dry && ! $local->exists($path)) {
                continue;
            }

            $ok = $local->exists($path)
                && $public->size($path) === $local->size($path)
                && hash('sha256', (string) $public->get($path)) === hash('sha256', (string) $local->get($path));

            if ($ok) {
                $verifiedOk++;
            } else {
                $verifyFail++;
                $failures[] = $path;
                $this->error("  VERIFY FAILED  {$path}");

                // Never purge a file that failed verification.
                continue;
            }

            // ── purge (verified only) ──
            if ($purge) {
                if ($dry) {
                    $this->line("  would purge  {$path}");
                } else {
                    $public->delete($path);
                    $purged++;
                }
            }
        }

        $this->newLine();
        $this->table(['Metric', 'Count'], [
            ['Scanned (public)', count($files)],
            ['Copied to private', $copied],
            ['Already private (skipped)', $skippedPresent],
            ['Verified identical', $verifiedOk],
            ['Verify FAILED', $verifyFail],
            ['Purged from public', $purged],
        ]);

        if ($verifyFail > 0) {
            $this->error("{$verifyFail} file(s) did NOT verify — originals were NOT purged. Investigate before re-running:");
            foreach ($failures as $f) {
                $this->line("  - {$f}");
            }

            return self::FAILURE;
        }

        if (! $purge) {
            $this->info('Copy + verify complete. Re-run with --purge to delete the public originals once you are satisfied.');
        } else {
            $this->info($dry ? 'Dry run complete — nothing was changed.' : 'Migration complete. Public originals purged.');
        }

        return self::SUCCESS;
    }
}
