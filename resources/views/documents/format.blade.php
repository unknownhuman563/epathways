<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        @page { margin: 26mm 20mm; }
        body {
            font-family: 'DejaVu Sans', Helvetica, Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.55;
            color: #1a1a1a;
        }
        h1 { font-size: 17pt; margin: 0 0 12pt; }
        h2 { font-size: 13pt; margin: 14pt 0 4pt; }
        h3 { font-size: 11.5pt; margin: 10pt 0 3pt; }
        p  { margin: 0 0 8pt; }
        ul, ol { margin: 0 0 8pt; padding-left: 18pt; }
        a { color: #4f46e5; }
        table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
        td, th { border: 0.5pt solid #999; padding: 4pt 6pt; text-align: left; }
        .header {
            border-bottom: 1pt solid #111;
            padding-bottom: 8pt;
            margin-bottom: 16pt;
            font-size: 9pt;
            color: #555;
            text-transform: uppercase;
            letter-spacing: 2pt;
        }
        .footer {
            border-top: 0.5pt solid #bbb;
            margin-top: 20pt;
            padding-top: 6pt;
            font-size: 8pt;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="header">{{ config('app.name', 'ePathways Limited') }}</div>
    <div class="body-content">{!! $content !!}</div>
    <div class="footer">
        {{ $title }} — Generated {{ now()->format('d F Y') }} · {{ config('app.name', 'ePathways Limited') }}
    </div>
</body>
</html>
