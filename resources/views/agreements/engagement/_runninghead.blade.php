{{--
    dompdf page_script — draws the running header + footer with page numbers
    on every page except the cover (page 1). Ignored by browsers, so the
    live HTML preview simply shows the body without this chrome.
--}}
<script type="text/php">
    if (isset($pdf)) {
        $header = "{{ $doc_header }}";
        $footerLeft = "D Immigration Consultancy Limited T/A Epathways Migration [NZBN 9429052569302]";
        $teal = [0.184, 0.490, 0.518];
        $grey = [0.42, 0.42, 0.42];
        $pdf->page_script(function ($pageNumber, $pageCount, $canvas, $fontMetrics) use ($header, $footerLeft, $teal, $grey) {
            if ($pageNumber <= 1) { return; } // skip cover
            $bold = $fontMetrics->getFont("Helvetica", "bold");
            $reg  = $fontMetrics->getFont("Helvetica", "normal");
            $w = $canvas->get_width();

            // Header (top-right)
            $hw = $fontMetrics->getTextWidth($header, $bold, 8);
            $canvas->text($w - 55 - $hw, 34, $header, $bold, 8, $teal);
            $sub = "D Immigration Consultancy Limited";
            $sw = $fontMetrics->getTextWidth($sub, $reg, 7.5);
            $canvas->text($w - 55 - $sw, 46, $sub, $reg, 7.5, $grey);

            // Footer
            $canvas->text(55, 812, $footerLeft, $reg, 7, $teal);
            $pageText = "Page " . $pageNumber . " of " . $pageCount;
            $pw = $fontMetrics->getTextWidth($pageText, $reg, 7.5);
            $canvas->text($w - 55 - $pw, 812, $pageText, $reg, 7.5, $grey);
        });
    }
</script>
