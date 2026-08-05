<?php

namespace App\Services\Immigration;

use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\ResidentIntake;
use Illuminate\Support\Facades\Storage;

/**
 * Copies a resident intake's uploaded files (stored on the ResidentIntake as
 * `document_files`) into LeadDocument rows for the case they were converted
 * into — so uploads made during the visa assessment appear in the case
 * profile's Documents tab. Before this, convert-to-case left those files on
 * the intake record only, and the case showed no documents.
 */
class IntakeDocumentMigrator
{
    private const LABELS = [
        'passport' => 'Passport',
        'visa_copies' => 'NZ visa copies',
        'contracts' => 'Employment contracts + JD',
        'payslips' => 'Payslips',
        'ird_summary' => 'IRD summary of earnings',
        'education_certs' => 'Education certificates',
        'cv' => 'CV',
        'other' => 'Other supporting documents',
    ];

    /**
     * Create LeadDocument rows on $lead for each uploaded file on $intake.
     * Idempotent — skips any file already migrated onto this lead (same
     * file_path). Returns the number of new LeadDocument rows created.
     */
    public static function fromResidentIntake(ResidentIntake $intake, Lead $lead): int
    {
        $files = $intake->document_files ?: [];
        if (! is_array($files) || $files === []) {
            return 0;
        }

        $created = 0;
        foreach ($files as $key => $paths) {
            foreach ((array) $paths as $path) {
                if (! is_string($path) || $path === '') {
                    continue;
                }
                if (LeadDocument::where('lead_id', $lead->id)->where('file_path', $path)->exists()) {
                    continue; // already migrated
                }

                $onDisk = Storage::disk('local')->exists($path);
                $ext = pathinfo($path, PATHINFO_EXTENSION) ?: 'pdf';
                $label = self::LABELS[$key] ?? ucwords(str_replace('_', ' ', (string) $key));

                LeadDocument::create([
                    'lead_id' => $lead->id,
                    'checklist_key' => is_string($key) ? $key : null,
                    'original_name' => $label.'.'.$ext,
                    'file_path' => $path,
                    'mime' => $onDisk ? (Storage::disk('local')->mimeType($path) ?: 'application/octet-stream') : 'application/octet-stream',
                    'size' => $onDisk ? (int) Storage::disk('local')->size($path) : 0,
                    'status' => LeadDocument::STATUS_SUBMITTED,
                    'source' => LeadDocument::SOURCE_UPLOAD,
                ]);
                $created++;
            }
        }

        return $created;
    }

    /** How many uploaded files sit on the intake (regardless of migration). */
    public static function fileCount(ResidentIntake $intake): int
    {
        $files = $intake->document_files ?: [];
        if (! is_array($files)) {
            return 0;
        }

        return collect($files)->reduce(fn ($n, $paths) => $n + count((array) $paths), 0);
    }
}
