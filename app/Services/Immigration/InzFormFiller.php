<?php

namespace App\Services\Immigration;

use App\Models\InzFormVersion;

/**
 * Fills the OFFICIAL INZ PDF (never a look-alike). Release 1 fills interactive
 * AcroForm fields in pure PHP via FPDM (FPDF family, no server binary). Flat
 * print forms (x/y overlay via FPDI+FPDF) come later, per form.
 *
 * The byte-level fill is isolated here so the rest of the pipeline (context →
 * map → LeadDocument → audit) is testable without a real PDF: tests bind a fake
 * implementation of this class.
 */
class InzFormFiller
{
    /** Whether the AcroForm field-fill library (FPDM) is available. */
    public function supported(): bool
    {
        return class_exists(\FPDM::class);
    }

    /** Whether the overlay engine (FPDI + FPDF) is available. */
    public function overlaySupported(): bool
    {
        return class_exists(\setasign\Fpdi\Fpdi::class);
    }

    /**
     * A version fills by OVERLAY when its map carries x/y coordinates — the
     * mechanism for real INZ PDFs (linearized / object-stream Adobe forms that
     * FPDM can't field-fill). We stamp the values onto the official page itself.
     */
    private function usesOverlay(InzFormVersion $version): bool
    {
        foreach (($version->field_map ?? []) as $e) {
            if (isset($e['x'], $e['y'])) {
                return true;
            }
        }

        return false;
    }

    /**
     * Fill a version's official PDF with case context, returning the PDF bytes.
     *
     * @param  array<string, string>  $context  from InzCaseContext::for()
     */
    public function fill(InzFormVersion $version, array $context): string
    {
        return $this->fillWithValues($version, $this->fieldValues($version, $context));
    }

    /**
     * Fill directly from explicit [pdfField => value] values (e.g. the client's
     * answers submitted from the lead portal), returning the PDF bytes.
     *
     * @param  array<string, string>  $values
     */
    public function fillWithValues(InzFormVersion $version, array $values): string
    {
        if (! $version->isReady()) {
            throw new \RuntimeException("No official PDF on file for {$version->form->code} ({$version->version_label}).");
        }

        // isReady() only checks the path is set — the file may be absent on this
        // server (e.g. uploaded on another environment, or the official-forms
        // seeder hasn't run here). Fail with a clear message rather than the
        // cryptic FPDI "No stream given." error.
        if (! \Illuminate\Support\Facades\Storage::disk('local')->exists($version->file_path)) {
            throw new \RuntimeException("The official PDF for {$version->form->code} isn't on this server. Re-upload it in Setup → INZ Forms, or run the official-forms seeder.");
        }

        // Real INZ PDFs use coordinate overlay; simple fillable PDFs use FPDM.
        return $this->usesOverlay($version)
            ? $this->overlayFill($version, $values)
            : $this->acroformFill($version, $values);
    }

    /**
     * AcroForm field-fill via FPDM — only works on "simple" fillable PDFs (no
     * linearization / object streams). Used by the hand-built demo form.
     *
     * @param  array<string, string>  $values
     */
    private function acroformFill(InzFormVersion $version, array $values): string
    {
        if (! $this->supported()) {
            throw new \RuntimeException('INZ fill library (FPDM) is not installed in this environment.');
        }

        $path = \Illuminate\Support\Facades\Storage::disk('local')->path($version->file_path);

        // FPDM die()s on structures it can't handle (linearization, object
        // streams, incremental updates) — every real Adobe INZ PDF. Pre-check
        // and throw a clean error rather than let die() abort the request.
        $head = (string) file_get_contents($path, false, null, 0, 2048);
        $tail = (string) file_get_contents($path, false, null, max(0, filesize($path) - 512), 512);
        if (str_contains($head, '/Linearized') || str_contains($head, '/ObjStm') || str_contains($tail, '/Prev')) {
            throw new \RuntimeException("{$version->form->code} {$version->version_label} is a modern PDF (needs the overlay map, not AcroForm fill).");
        }

        // FPDM is legacy code that emits benign PHP 8 warnings (e.g. "Undefined
        // array key") while parsing. Laravel's error handler promotes those to
        // fatal ErrorExceptions, so silence non-fatal levels for the fill only —
        // genuine failures still surface via FPDM's own Error()/exceptions.
        $previous = error_reporting();
        error_reporting($previous & ~(E_WARNING | E_NOTICE | E_DEPRECATED));

        try {
            $pdf = new \FPDM($path);
            $pdf->Load($values, true); // true = values are UTF-8
            $pdf->Merge();

            // tmw/fpdm signature is Output($dest, $name): 'S' = return as a string.
            return $pdf->Output('S');
        } finally {
            error_reporting($previous);
        }
    }

    /**
     * Overlay fill for real official INZ PDFs: import each page of the OFFICIAL
     * document as the background (FPDI) and stamp the case values at the mapped
     * x/y positions (FPDF, millimetres, origin top-left). The output IS the
     * official form with the data written on it — never a facsimile.
     *
     * Map entry shape: { pdf_field, source, page, x, y, size? }.
     *
     * @param  array<string, string>  $values  [pdf_field => text]
     */
    private function overlayFill(InzFormVersion $version, array $values): string
    {
        if (! $this->overlaySupported()) {
            throw new \RuntimeException('INZ overlay engine (FPDI/FPDF) is not installed in this environment.');
        }

        $path = \Illuminate\Support\Facades\Storage::disk('local')->path($version->file_path);

        // Group mapped fields by page so we stamp during that page's pass.
        $byPage = [];
        foreach (($version->field_map ?? []) as $e) {
            if (! isset($e['x'], $e['y'], $e['pdf_field'])) {
                continue;
            }
            $byPage[(int) ($e['page'] ?? 1)][] = $e;
        }

        $previous = error_reporting();
        error_reporting($previous & ~(E_WARNING | E_NOTICE | E_DEPRECATED));

        try {
            $pdf = new \setasign\Fpdi\Fpdi();
            try {
                $pageCount = $pdf->setSourceFile($path);
            } catch (\setasign\Fpdi\PdfParser\CrossReference\CrossReferenceException $e) {
                throw new \RuntimeException("{$version->form->code} {$version->version_label} uses a compressed PDF structure the free engine can't read. Re-save it without Fast Web View, or enable the compressed-PDF parser.");
            }

            for ($n = 1; $n <= $pageCount; $n++) {
                $tpl = $pdf->importPage($n);
                $size = $pdf->getTemplateSize($tpl);
                $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
                $pdf->useTemplate($tpl);
                $pdf->SetFont('Helvetica', '', 10);
                $pdf->SetTextColor(11, 42, 74); // dark ink, distinct from print

                foreach (($byPage[$n] ?? []) as $e) {
                    $text = (string) ($values[$e['pdf_field']] ?? '');
                    if ($text === '') {
                        continue;
                    }
                    $pdf->SetFontSize((float) ($e['size'] ?? 10));
                    $pdf->SetXY((float) $e['x'], (float) $e['y']);
                    // FPDF core fonts are Windows-1252; convert from UTF-8.
                    $pdf->Write(5, mb_convert_encoding($text, 'Windows-1252', 'UTF-8'));
                }
            }

            return $pdf->Output('S');
        } finally {
            error_reporting($previous);
        }
    }

    /**
     * The client-fillable fields for a version: one per map entry that points at
     * a case value (literals are fixed, so excluded). Pre-filled from what we
     * already hold; the client can complete/correct.
     *
     * @param  array<string, string>  $context
     * @param  array<string, string>|null  $override  saved client answers [pdfField => value]
     * @return array<int, array{key: string, label: string, value: string}>
     */
    public function clientFields(InzFormVersion $version, array $context, ?array $override = null): array
    {
        $fields = [];
        foreach (($version->field_map ?? []) as $entry) {
            if (empty($entry['pdf_field']) || empty($entry['source'])) {
                continue; // literals / unmapped aren't client-fillable
            }
            $pdf = $entry['pdf_field'];
            $fields[] = [
                'key' => $pdf,
                'label' => ucwords(str_replace(['.', '_'], ' ', $entry['source'])),
                'value' => $override[$pdf] ?? ($context[$entry['source']] ?? ''),
            ];
        }

        return $fields;
    }

    /**
     * Resolve the version's field_map (pdf_field → context source key) against
     * the case context. Unmapped/absent sources yield '' — never a guess.
     *
     * field_map shape: [ { "pdf_field": "Family_last_name", "source": "applicant.family_name" }, … ]
     *
     * @param  array<string, string>  $context
     * @return array<string, string> [pdfFieldName => value]
     */
    public function fieldValues(InzFormVersion $version, array $context): array
    {
        $out = [];
        foreach (($version->field_map ?? []) as $entry) {
            if (empty($entry['pdf_field'])) {
                continue;
            }
            $source = $entry['source'] ?? null;
            $out[$entry['pdf_field']] = $source !== null ? ($context[$source] ?? '') : (string) ($entry['literal'] ?? '');
        }

        return $out;
    }

    /**
     * Cheap heuristic to flag whether an uploaded PDF is a fillable AcroForm
     * (so we know field-fill vs the later overlay path). Not a validator.
     */
    public function looksLikeAcroForm(string $pdfBytes): bool
    {
        return str_contains($pdfBytes, '/AcroForm');
    }
}
