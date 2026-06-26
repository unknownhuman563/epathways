<?php

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

/**
 * Thin wrapper around barryvdh/laravel-dompdf so service classes can
 * render HTML to a stored PDF without binding to the facade directly.
 *
 * Storage convention matches AgreementGenerator: 'local' disk (mapped
 * to storage/app/private/) so generated PDFs are kept out of the public
 * web root. Callers pass a relative path; the wrapper returns the same
 * path so it can be stored on the originating record.
 *
 * For testability, tests should swap this with a fake binding that
 * skips actual PDF generation when not relevant — see
 * tests/Feature/Immigration/AgreementGenerationTest.php.
 */
class PdfGenerator
{
    public function __construct(protected string $disk = 'local')
    {
    }

    /**
     * Render HTML to a PDF file at the given relative path. Returns the
     * relative path so the caller can store it (e.g. on the agreement
     * record's pdf_path column).
     */
    public function renderToFile(string $html, string $relativePath, string $paper = 'a4'): string
    {
        $pdf = Pdf::loadHTML($html)->setPaper($paper);
        Storage::disk($this->disk)->put($relativePath, $pdf->output());
        return $relativePath;
    }
}
