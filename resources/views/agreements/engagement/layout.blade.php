{{--
    Shared branded layout for the immigration engagement documents
    (Written Agreement, Professional Standards, Code of Conduct,
    Complaints Procedure). Renders a full teal cover page then yields the
    document body. Running header/footer with page numbers are drawn via a
    dompdf page_script (skips the cover) — inert in the browser preview,
    which only needs the body.

    Vars expected:
        $logo_data     — data: URI of the ePathways Migration logo
        $doc_header    — running-header title, e.g. "WRITTEN AGREEMENT"
        $cover_eyebrow — small line above the cover title
        $cover_title   — big cover title (may contain <br>)
        $cover_subtitle— line under the cover title (nullable)
        $contact       — ['email','phone','website']
--}}
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{{ $doc_header }} — D Immigration Consultancy Limited</title>
<style>
    @font-face { font-family: 'Urbanist'; font-weight: 400; src: url('{{ base_path("resources/fonts/urbanist/Urbanist-Regular.ttf") }}') format('truetype'); }
    @font-face { font-family: 'Urbanist'; font-style: italic; font-weight: 400; src: url('{{ base_path("resources/fonts/urbanist/Urbanist-Italic.ttf") }}') format('truetype'); }
    @font-face { font-family: 'Urbanist'; font-weight: 700; src: url('{{ base_path("resources/fonts/urbanist/Urbanist-Bold.ttf") }}') format('truetype'); }

    @page { margin: 95px 55px 60px 55px; }
    * { box-sizing: border-box; }
    body { font-family: 'Urbanist', DejaVu Sans, sans-serif; font-size: 10.5pt; color: #1f2937; line-height: 1.5; margin: 0; }

    /* ---- Cover page ---- */
    /* Skyline sits bottom-anchored over the flat teal. The image already
       carries the teal wash and its own top fade (see coverBgData), so no
       opacity or blend mode is needed — dompdf supports neither. */
    .cover { position: relative; background: #2f7d84; color: #ffffff; height: 940px; margin: -95px -55px 0 -55px; padding: 55px 55px 40px 55px;
             background-image: url('{{ $cover_bg_data ?? '' }}'); background-repeat: no-repeat; background-position: bottom center; }
    .cover .brand-row { width: 100%; }
    .cover .brand-row td { vertical-align: top; }
    .cover .logo-chip { background: #ffffff; display: inline-block; padding: 14px 18px; border-radius: 2px; }
    .cover .logo-chip img { height: 42px; width: auto; }
    .cover .company { text-align: right; font-size: 15pt; font-weight: 700; line-height: 1.25; }
    .cover .cover-mid { position: absolute; left: 55px; right: 55px; top: 360px; }
    .cover .eyebrow { font-size: 15pt; font-weight: 400; opacity: 0.92; margin-bottom: 8px; }
    .cover .title { font-size: 46pt; font-weight: 700; line-height: 1.02; letter-spacing: -1px; }
    .cover .subtitle { font-size: 17pt; font-weight: 400; opacity: 0.92; margin-top: 10px; }
    .cover .rule { position: absolute; left: 55px; right: 55px; bottom: 120px; border-top: 2px solid rgba(255,255,255,0.5); }
    .cover .contact { position: absolute; left: 55px; right: 55px; bottom: 46px; width: auto; }
    .cover .contact td { width: 33%; vertical-align: top; }
    .cover .contact .c-label { font-size: 9.5pt; font-weight: 700; margin-bottom: 3px; }
    .cover .contact .c-val { font-size: 9.5pt; opacity: 0.92; }

    /* ---- Body ---- */
    .doc-title { color: #2f7d84; font-size: 20pt; font-weight: 700; margin: 4px 0 2px 0; }
    .doc-sub { color: #2f7d84; font-style: italic; font-size: 10.5pt; margin: 0 0 4px 0; }
    .title-rule { border: 0; border-top: 3px solid #2f7d84; margin: 10px 0 20px 0; }
    h2.section { color: #2f7d84; font-size: 12.5pt; font-weight: 700; margin: 20px 0 4px 0; padding-bottom: 5px; border-bottom: 1px solid #e5e7eb; }
    h3 { color: #374151; font-size: 11pt; margin: 14px 0 4px 0; }
    p { margin: 7px 0; text-align: justify; }
    .clause { margin: 7px 0; }
    .clause .n { color: #2f7d84; font-weight: 700; }
    ul, ol { margin: 6px 0 6px 0; padding-left: 20px; }
    li { margin: 3px 0; text-align: justify; }
    .lead-intro { color: #4b5563; font-size: 11pt; }

    table.data { width: 100%; border-collapse: collapse; margin: 12px 0; }
    table.data td, table.data th { border: 1px solid #e5e7eb; padding: 8px 12px; font-size: 10pt; text-align: left; vertical-align: top; }
    table.data td.label { width: 32%; font-weight: 700; color: #374151; }
    table.data .fill { color: #2f7d84; font-style: italic; }
    table.head th { background: #2f7d84; color: #ffffff; border-color: #2f7d84; font-weight: 700; }
    table.head td.amount, table.head th.amount { text-align: right; }
    .muted { color: #6b7280; font-style: italic; font-size: 9.5pt; }
    .callout { border-left: 3px solid #2f7d84; background: #f0f7f7; padding: 10px 14px; margin: 12px 0; border-radius: 0 6px 6px 0; }
    .sign-tbl { width: 100%; margin-top: 30px; }
    .sign-tbl td { width: 50%; vertical-align: top; padding-right: 24px; }
    .sign-line { border-bottom: 1px solid #374151; height: 34px; }
    .sign-cap { font-style: italic; color: #6b7280; font-size: 9pt; padding-top: 4px; }
    .avoid-break { page-break-inside: avoid; }
</style>

@if(!empty($preview))
{{-- On-screen preview only: frame the body as an A4 page at 12pt so the
     live preview reads like the printed document. Ignored by dompdf. --}}
<style>
    html { background: #e5e7eb; padding: 0; margin: 0; }
    body {
        width: 794px;                 /* A4 width @ 96dpi */
        min-height: 1123px;           /* A4 height @ 96dpi */
        margin: 24px auto;
        padding: 95px 55px 60px 55px; /* mirrors the @page margins */
        background: #ffffff;
        box-shadow: 0 2px 14px rgba(0,0,0,0.14);
        font-size: 12pt;
    }
    .cover { margin: -95px -55px 0 -55px; }
</style>
@endif

@include('agreements.engagement._runninghead')
</head>
<body>

{{-- ---------- COVER ---------- --}}
<div class="cover">
    <table class="brand-row"><tr>
        <td><span class="logo-chip"><img src="{{ $logo_data }}" alt="ePathways Migration"></span></td>
        <td><div class="company">D Immigration<br>Consultancy Limited</div></td>
    </tr></table>

    <div class="cover-mid">
        @if(!empty($cover_eyebrow))<div class="eyebrow">{{ $cover_eyebrow }}</div>@endif
        <div class="title">{!! $cover_title !!}</div>
        @if(!empty($cover_subtitle))<div class="subtitle">{{ $cover_subtitle }}</div>@endif
    </div>

    <div class="rule"></div>
    <table class="contact"><tr>
        <td><div class="c-label">Email</div><div class="c-val">{{ $contact['email'] }}</div></td>
        <td><div class="c-label">Phone Number</div><div class="c-val">{{ $contact['phone'] }}</div></td>
        <td><div class="c-label">Website</div><div class="c-val">{{ $contact['website'] }}</div></td>
    </tr></table>
</div>

<div style="page-break-after: always;"></div>

{{-- ---------- BODY ---------- --}}
@yield('body')

</body>
</html>
