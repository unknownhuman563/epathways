<?php

namespace App\Services\Immigration;

use Smalot\PdfParser\Parser;

/**
 * Reads the AcroForm field geometry out of an official INZ PDF so the overlay
 * filler knows WHERE to stamp each value. Adobe names fields generically
 * ("Text Field 73"), so we key by that name and return the position in FPDF
 * space: millimetres, origin top-left (PDF stores points, origin bottom-left).
 *
 * smalot/pdfparser is used because it decompresses the object streams that
 * modern (linearized, PDF 1.6/1.7) government forms use — FPDI's free parser
 * and FPDM both choke on those.
 */
class InzFieldExtractor
{
    private const PT_TO_MM = 25.4 / 72.0;

    /** Whether the extractor's dependency is available. */
    public function supported(): bool
    {
        return class_exists(Parser::class);
    }

    /**
     * @return array<string, array{page:int, x:float, y:float, w:float, h:float}>
     *         keyed by the PDF field name (T)
     */
    public function extract(string $absolutePath): array
    {
        $parser = new Parser();

        $previous = error_reporting();
        error_reporting($previous & ~(E_WARNING | E_NOTICE | E_DEPRECATED));

        try {
            $doc = $parser->parseFile($absolutePath);

            // Page object → 1-based index, and its height in points (for the
            // y-axis flip). INZ forms are A4 but we read each page to be safe.
            $pageIndex = [];
            $pageHeight = [];
            foreach ($doc->getPages() as $i => $page) {
                $pageIndex[spl_object_id($page)] = $i + 1;
                $pageHeight[$i + 1] = $this->pageHeightPt($page);
            }

            $out = [];
            foreach ($doc->getObjects() as $obj) {
                $header = $obj->getHeader();
                $el = $header->getElements();
                if (! is_array($el) || ! isset($el['Rect'], $el['T'])) {
                    continue;
                }

                $name = (string) $header->get('T');
                $rect = array_map(
                    fn ($v) => (float) (is_object($v) ? $v->getContent() : $v),
                    $el['Rect']->getContent(),
                );
                if (count($rect) !== 4) {
                    continue;
                }
                [$x0, $y0, $x1, $y1] = $rect;

                $pEl = $header->get('P');
                $page = (is_object($pEl) && isset($pageIndex[spl_object_id($pEl)])) ? $pageIndex[spl_object_id($pEl)] : 1;
                $hPt = $pageHeight[$page] ?? 842.0;

                $out[$name] = [
                    'page' => $page,
                    // Nudge in ~1.6mm from the box's left edge / top so the ink
                    // sits inside the field rather than on its border line.
                    'x' => round($x0 * self::PT_TO_MM + 1.6, 2),
                    'y' => round(($hPt - $y1) * self::PT_TO_MM + 1.4, 2),
                    'w' => round(($x1 - $x0) * self::PT_TO_MM, 2),
                    'h' => round(($y1 - $y0) * self::PT_TO_MM, 2),
                ];
            }

            return $out;
        } finally {
            error_reporting($previous);
        }
    }

    /**
     * Build a stored overlay field_map from a semantic [source => fieldName]
     * mapping, resolving each field name to its page + x/y via extract().
     * Field names that aren't found in the PDF are skipped (logged upstream).
     *
     * @param  array<string, string>  $sourceToField  e.g. ['applicant.family_name' => 'Text Field 2']
     * @return array<int, array{pdf_field:string, source:string, page:int, x:float, y:float, size:float}>
     */
    public function buildOverlayMap(string $absolutePath, array $sourceToField, float $size = 10.0): array
    {
        $geometry = $this->extract($absolutePath);
        $map = [];
        foreach ($sourceToField as $source => $fieldName) {
            if (! isset($geometry[$fieldName])) {
                continue;
            }
            $g = $geometry[$fieldName];
            $map[] = [
                'pdf_field' => $fieldName,
                'source' => $source,
                'page' => $g['page'],
                'x' => $g['x'],
                'y' => $g['y'],
                'size' => $size,
            ];
        }

        return $map;
    }

    /** A4 fallback when a page has no explicit MediaBox we can read. */
    private function pageHeightPt($page): float
    {
        try {
            $details = $page->getDetails(false);
            if (isset($details['MediaBox']) && is_array($details['MediaBox']) && count($details['MediaBox']) === 4) {
                $mb = array_map(fn ($v) => (float) (is_object($v) ? $v->getContent() : $v), $details['MediaBox']);

                return abs($mb[3] - $mb[1]) ?: 842.0;
            }
        } catch (\Throwable $e) {
            // fall through to A4
        }

        return 842.0;
    }
}
