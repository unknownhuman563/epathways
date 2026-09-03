<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;

/**
 * Shared "document tab" handling for the public visa intakes (Student, Visitor,
 * Family — same checklist as the Resident intake). Uploaded files hold personal
 * data on an unauthenticated public form, so they are stored on the PRIVATE
 * (`local`) disk only; the JSON `document_files` column keeps a [key => [paths]]
 * map that IntakeDocumentMigrator later carries onto the case.
 */
trait HandlesIntakeDocuments
{
    /** Checklist keys => labels. Keys are the contract — renaming one orphans files. */
    public const INTAKE_DOCUMENT_LABELS = [
        'passport'        => 'Passport (all pages)',
        'visa_copies'     => 'All NZ visa copies',
        'contracts'       => 'NZ employment contracts + JD',
        'payslips'        => 'Payslips — first 2 mo + latest 1 mo',
        'ird_summary'     => 'IRD summary of earnings (monthly)',
        'education_certs' => 'Education certificates / transcripts',
        'cv'              => 'CV (NZ + overseas history)',
        'other'           => 'Other supporting documents',
    ];

    /** Validation rules for the document tab — merged into the intake's rules(). */
    protected function intakeDocumentRules(): array
    {
        return [
            'documents'          => 'nullable|array',
            'documents.*'        => 'nullable',
            'document_files'     => 'nullable|array',
            'document_files.*'   => 'nullable|array',
            'document_files.*.*' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ];
    }

    /**
     * Store each uploaded document under the intake's folder on the private disk
     * and return [key => [paths...]]. `$folder` e.g. "student-intakes".
     */
    protected function persistIntakeFiles(Request $request, string $folder, string $intakeId): array
    {
        $files = [];
        foreach ((array) $request->file('document_files', []) as $key => $uploads) {
            if (! array_key_exists($key, self::INTAKE_DOCUMENT_LABELS)) {
                continue; // ignore unknown keys
            }
            $paths = [];
            foreach ((array) $uploads as $file) {
                if ($file instanceof UploadedFile) {
                    $paths[] = $file->store("{$folder}/{$intakeId}", 'local');
                }
            }
            if (! empty($paths)) {
                $files[$key] = $paths;
            }
        }

        return $files;
    }
}
