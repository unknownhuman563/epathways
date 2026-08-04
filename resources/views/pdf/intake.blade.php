<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Visa Information Form — {{ $applicant }}</title>
    <style>
        @page { margin: 66px 40px 46px 40px; }

        * { box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; color: #22303f; font-size: 9.5px; line-height: 1.4; margin: 0; }

        /* ── Repeating page header / footer ─────────────────── */
        .pagehead { position: fixed; top: -50px; left: 0; right: 0; }
        .pagehead .brand { font-size: 12px; font-weight: bold; color: #1F4E79; }
        .pagehead .sub { font-size: 7.5px; color: #8a97a5; }
        .pagehead .rule { border-bottom: 2px solid #1F4E79; margin-top: 2px; }

        .pagefoot { position: fixed; bottom: -30px; left: 0; right: 0; text-align: center; font-size: 7.5px; color: #9aa6b2; }
        .pagefoot:after { content: "Visa Information Form – General Application   |   Page " counter(page) " of " counter(pages); }

        /* ── Title block ─────────────────────────────────────── */
        .title { font-size: 24px; font-weight: bold; color: #1F4E79; margin: 2px 0 0; }
        .subtitle { font-size: 13px; color: #2E74B5; margin: 0 0 8px; }
        .intro {
            background: #ddebf7; border: 1px solid #9cc3e5; border-left: 4px solid #2E74B5;
            padding: 8px 12px; font-size: 9px; color: #1f3a54; margin-bottom: 14px;
        }
        .meta { font-size: 8px; color: #8a97a5; margin-bottom: 12px; }
        .meta b { color: #5a6b7b; }

        /* ── Section ─────────────────────────────────────────── */
        .section { margin-bottom: 12px; }
        .section-title { font-size: 12px; font-weight: bold; color: #2E74B5; margin: 0 0 4px; }

        table.qa { width: 100%; border-collapse: collapse; }
        table.qa td { border: 1px solid #cdddec; vertical-align: top; padding: 5px 8px; }
        td.qh { background: #2E74B5; color: #ffffff; font-weight: bold; font-size: 9px; }
        td.q { background: #e9f0f8; color: #1f3a54; width: 46%; }
        td.a { background: #ffffff; width: 54%; min-height: 16px; }
        td.sub { background: #2E74B5; color: #ffffff; font-weight: bold; font-size: 9px; }
        td.subalt { background: #5b9bd5; color: #ffffff; font-weight: bold; font-size: 9px; }
        td.note { background: #eef4fb; color: #46586b; font-style: italic; font-size: 8.5px; }
        td.check { background: #ffffff; border: none; padding: 3px 0; font-size: 9.5px; }
        td.legal { background: #f4f7fb; border: 1px solid #dbe6f1; color: #46586b; font-size: 8.5px; padding: 8px 10px; }

        .cbox { font-size: 11px; color: #1F4E79; }
    </style>
</head>
<body>
    {{-- Repeating header + footer on every page --}}
    <div class="pagehead">
        <div class="brand">ePathways</div>
        <div class="sub">Immigration Advisers – New Zealand</div>
        <div class="rule"></div>
    </div>
    <div class="pagefoot"></div>

    {{-- Title --}}
    <div class="title">Visa Information Form</div>
    <div class="subtitle">General Application · {{ date('Y') }}</div>
    <div class="intro">
        <b>Applicant summary.</b> The answers below were provided by the applicant through their
        online visa assessment. Blank fields were not supplied. This document is prepared for the
        Licensed Immigration Adviser to review.
    </div>
    <div class="meta">
        <b>Applicant:</b> {{ $applicant }}
        @if ($intakeId) &nbsp;&nbsp; <b>Reference:</b> {{ $intakeId }} @endif
        &nbsp;&nbsp; <b>Generated:</b> {{ $generatedAt }}
    </div>

    @foreach ($sections as $section)
        @php $isK = ($section['letter'] ?? '') === 'K'; @endphp
        <div class="section">
            <div class="section-title">Section {{ $section['letter'] }} – {{ $section['title'] }}</div>
            <table class="qa">
                @unless ($isK)
                    <tr>
                        <td class="qh">Question</td>
                        <td class="qh">Your answer</td>
                    </tr>
                @endunless
                @foreach ($section['rows'] as $row)
                    @switch($row['t'])
                        @case('sub')
                            <tr><td class="sub" colspan="2">{{ $row['label'] }}</td></tr>
                            @break
                        @case('note')
                            <tr><td class="note" colspan="2">{{ $row['label'] }}</td></tr>
                            @break
                        @case('check')
                            <tr><td class="check" colspan="2"><span class="cbox">{{ $row['on'] ? '☑' : '☐' }}</span> {{ $row['label'] }}</td></tr>
                            @break
                        @case('legal')
                            <tr><td class="legal" colspan="2">{{ $row['label'] }}</td></tr>
                            @break
                        @default
                            <tr>
                                <td class="q">{{ $row['q'] }}</td>
                                <td class="a">{{ $row['a'] }}</td>
                            </tr>
                    @endswitch
                @endforeach
            </table>
        </div>
    @endforeach
</body>
</html>
