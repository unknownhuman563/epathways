<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }} — Signed</title>
    <style>
        @page { margin: 28mm 22mm; }
        body {
            font-family: 'DejaVu Serif', 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.55;
            color: #111;
        }
        h1 {
            font-family: 'DejaVu Sans', Helvetica, Arial, sans-serif;
            font-size: 16pt;
            margin: 0 0 16pt;
            text-align: center;
            letter-spacing: 0.5pt;
        }
        p { margin: 0 0 8pt; }
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
        .body-content { white-space: pre-wrap; }
        .signature-block {
            margin-top: 28pt;
            padding-top: 14pt;
            border-top: 1pt solid #111;
        }
        .signature-block h2 {
            font-family: 'DejaVu Sans', Helvetica, Arial, sans-serif;
            font-size: 11pt;
            margin: 0 0 8pt;
            letter-spacing: 0.5pt;
        }
        .signature-image {
            display: block;
            max-width: 240pt;
            max-height: 80pt;
            margin: 8pt 0;
            border-bottom: 0.5pt solid #999;
        }
        .signer-meta {
            font-size: 9pt;
            color: #333;
            margin-top: 4pt;
        }
        .signer-meta dt {
            float: left;
            width: 80pt;
            color: #666;
            font-weight: bold;
        }
        .signer-meta dd { margin: 0 0 2pt 80pt; }
        .audit-footer {
            margin-top: 24pt;
            padding-top: 6pt;
            border-top: 0.5pt solid #999;
            font-size: 7.5pt;
            color: #666;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">{{ config('app.name', 'ePathways Limited') }} — Signed Agreement</div>
    <h1>{{ $title }}</h1>
    <div class="body-content">{!! nl2br(e($content)) !!}</div>

    <div class="signature-block">
        <h2>Electronic signature</h2>
        @if($signature_src)
            <img class="signature-image" src="{{ $signature_src }}" alt="Signature">
        @endif
        <dl class="signer-meta">
            <dt>Signed by:</dt><dd>{{ $signer_name }}</dd>
            <dt>Signed at:</dt><dd>{{ $signed_at?->format('d F Y, H:i') ?? '—' }} NZ time</dd>
            <dt>IP address:</dt><dd>{{ $signer_ip ?? '—' }}</dd>
            <dt>User agent:</dt><dd>{{ $signer_ua ?? '—' }}</dd>
        </dl>
    </div>

    <div class="audit-footer">
        Signed electronically via the {{ config('app.name', 'ePathways Limited') }} tracker.
        This is an in-CRM e-signature stub; identity verification beyond the bearer token is not asserted.
    </div>
</body>
</html>
