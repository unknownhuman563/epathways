<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $fullName }} — {{ $typeLabel }}</title>
    <style>
        @page { margin: 32px 36px 48px 36px; }

        * { box-sizing: border-box; }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            color: #1f2937;
            font-size: 11px;
            line-height: 1.45;
            margin: 0;
        }

        /* ── Header ─────────────────────────────────────────── */
        .brandbar {
            border-bottom: 2px solid #047857;
            padding-bottom: 8px;
            margin-bottom: 16px;
        }
        .brandbar .brand { font-size: 15px; font-weight: bold; color: #047857; letter-spacing: -0.3px; }
        .brandbar .doc { float: right; font-size: 9px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.5px; padding-top: 4px; }

        .hero { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 16px; margin-bottom: 14px; }
        .hero .name { font-size: 20px; font-weight: bold; color: #111827; }
        .hero .meta { font-size: 10px; color: #6b7280; margin-top: 2px; }
        .hero .meta .id { font-family: 'DejaVu Sans Mono', monospace; color: #9ca3af; margin-left: 6px; }
        .status {
            float: right; font-size: 9px; font-weight: bold; color: #1d4ed8;
            background: #dbeafe; border: 1px solid #bfdbfe; border-radius: 4px;
            padding: 3px 8px; text-transform: uppercase; letter-spacing: 0.5px;
        }

        .chips { margin-top: 10px; }
        .chip {
            display: inline-block; font-size: 9.5px; color: #374151;
            background: #ffffff; border: 1px solid #d1fae5; border-radius: 4px;
            padding: 3px 8px; margin: 0 4px 4px 0;
        }

        /* ── Summary strip ──────────────────────────────────── */
        .summary { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .summary td { width: 33%; vertical-align: top; padding: 8px 10px; border: 1px solid #e5e7eb; background: #f9fafb; }
        .summary .lbl { font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; font-weight: bold; }
        .summary .val { font-size: 11px; color: #111827; margin-top: 2px; word-wrap: break-word; }

        /* ── Sections ───────────────────────────────────────── */
        .section { margin-bottom: 12px; page-break-inside: avoid; }
        .section-title {
            font-size: 11px; font-weight: bold; color: #065f46;
            background: #ecfdf5; border-left: 3px solid #047857;
            padding: 5px 10px; margin-bottom: 0;
        }
        .section.headline .section-title { background: #047857; color: #ffffff; border-left-color: #065f46; }

        table.fields { width: 100%; border-collapse: collapse; }
        table.fields td {
            vertical-align: top; padding: 7px 10px;
            border: 1px solid #eef2f5; width: 50%;
        }
        table.fields td.full { width: 100%; }
        .flbl { font-size: 8px; text-transform: uppercase; letter-spacing: 0.8px; color: #9ca3af; font-weight: bold; }
        .fval { font-size: 10.5px; color: #1f2937; margin-top: 2px; word-wrap: break-word; }
        .fval.multi {
            background: #f9fafb; border: 1px solid #eef2f5; border-radius: 4px;
            padding: 5px 8px; margin-top: 3px; white-space: pre-wrap;
        }

        /* ── Footer ─────────────────────────────────────────── */
        .footer {
            position: fixed; bottom: -30px; left: 0; right: 0;
            font-size: 8px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 5px;
        }
        .footer .r { float: right; }
    </style>
</head>
<body>
    <div class="brandbar">
        <span class="brand">ePathways.</span>
        <span class="doc">{{ $typeLabel }}</span>
    </div>

    <div class="hero">
        <span class="status">{{ $status }}</span>
        <div class="name">{{ $fullName }}</div>
        <div class="meta">
            {{ $typeLabel }}
            @if ($intakeId)<span class="id">{{ $intakeId }}</span>@endif
        </div>
        @if (count($snapshot))
            <div class="chips">
                @foreach ($snapshot as $chip)
                    <span class="chip">{{ $chip }}</span>
                @endforeach
            </div>
        @endif
    </div>

    <table class="summary">
        <tr>
            <td>
                <div class="lbl">Email</div>
                <div class="val">{{ $email ?: '—' }}</div>
            </td>
            <td>
                <div class="lbl">Phone</div>
                <div class="val">{{ $phone ?: '—' }}</div>
            </td>
            <td>
                <div class="lbl">Submitted</div>
                <div class="val">{{ $submittedAt ?: '—' }}</div>
            </td>
        </tr>
        @if ($address)
            <tr>
                <td colspan="3">
                    <div class="lbl">Current address</div>
                    <div class="val">{{ $address }}</div>
                </td>
            </tr>
        @endif
    </table>

    @foreach ($sections as $section)
        <div class="section {{ $section['headline'] ? 'headline' : '' }}">
            <div class="section-title">{{ $section['title'] }}</div>
            <table class="fields">
                @foreach ($section['rows'] as $row)
                    <tr>
                        @foreach ($row as $field)
                            <td class="{{ $field['full'] ? 'full' : '' }}" @if ($field['full']) colspan="2" @endif>
                                <div class="flbl">{{ $field['label'] }}</div>
                                @if ($field['full'])
                                    <div class="fval multi">{{ $field['value'] }}</div>
                                @else
                                    <div class="fval">{{ $field['value'] }}</div>
                                @endif
                            </td>
                        @endforeach
                        @if (count($row) === 1 && ! $row[0]['full'])
                            <td></td>
                        @endif
                    </tr>
                @endforeach
            </table>
        </div>
    @endforeach

    <div class="footer">
        ePathways — {{ $typeLabel }}
        <span class="r">Generated {{ $generatedAt }}</span>
    </div>
</body>
</html>
