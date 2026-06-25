<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        @page { margin: 28mm 22mm; }
        body {
            font-family: 'DejaVu Serif', 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.55;
            color: #111;
        }
        h1, h2, h3 { font-family: 'DejaVu Sans', Helvetica, Arial, sans-serif; }
        h1 { font-size: 16pt; margin: 0 0 16pt; text-align: center; letter-spacing: 0.5pt; }
        h2 { font-size: 12pt; margin: 14pt 0 4pt; }
        h3 { font-size: 11pt; margin: 10pt 0 3pt; }
        p  { margin: 0 0 8pt; }
        .header {
            border-bottom: 1pt solid #111;
            padding-bottom: 8pt;
            margin-bottom: 14pt;
            text-align: center;
            font-size: 9pt;
            color: #555;
            text-transform: uppercase;
            letter-spacing: 2pt;
        }
        .footer {
            border-top: 0.5pt solid #999;
            margin-top: 18pt;
            padding-top: 6pt;
            font-size: 8pt;
            color: #666;
            text-align: center;
        }
        .body-content {
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <div class="header">{{ config('app.name', 'ePathways Limited') }}</div>
    <h1>{{ $title }}</h1>
    <div class="body-content">{!! nl2br(e($content)) !!}</div>
    <div class="footer">
        Generated {{ now()->format('d F Y, H:i') }} — {{ config('app.name', 'ePathways Limited') }}
    </div>
</body>
</html>
