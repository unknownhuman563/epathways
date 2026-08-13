<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Daily Time & Task Record — {{ $name }} — {{ $date }}</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; color: #1f2937; font-size: 12px; margin: 0; padding: 36px 40px; }
        .brand { color: #436235; font-weight: bold; font-size: 20px; letter-spacing: -0.5px; }
        .eyebrow { color: #9ca3af; font-size: 9px; font-weight: bold; letter-spacing: 2.5px; text-transform: uppercase; }
        .head { border-bottom: 2px solid #436235; padding-bottom: 14px; margin-bottom: 18px; }
        .head td { vertical-align: top; }
        h1 { font-size: 17px; margin: 2px 0 0; }
        .meta { margin: 0 0 18px; }
        .meta td { padding: 2px 0; }
        .meta .label { color: #6b7280; width: 130px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; }
        .meta .value { font-weight: bold; color: #111827; }
        .stats { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
        .stats td { border: 1px solid #e5e7eb; padding: 9px 12px; width: 33.33%; }
        .stats .k { font-size: 9px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; }
        .stats .v { font-size: 15px; font-weight: bold; color: #111827; padding-top: 3px; }
        .v.neg { color: #e11d48; } .v.pos { color: #059669; }
        .pill { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
        .pill.ontime { background: #d1fae5; color: #047857; }
        .pill.late { background: #ffe4e6; color: #be123c; }
        .pill.flexi { background: #e0e7ff; color: #4338ca; }
        .section-title { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #6b7280; margin: 0 0 6px; }
        table.tasks { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
        table.tasks th { background: #f3f4f6; border: 1px solid #e5e7eb; padding: 7px 10px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; }
        table.tasks td { border: 1px solid #e5e7eb; padding: 7px 10px; vertical-align: top; }
        table.tasks td.num { text-align: center; color: #9ca3af; width: 28px; }
        .remarks { border: 1px solid #e5e7eb; border-radius: 4px; padding: 10px 12px; min-height: 40px; color: #374151; margin-bottom: 24px; }
        .sign { width: 100%; margin-top: 28px; }
        .sign td { width: 50%; padding-top: 30px; vertical-align: bottom; }
        .sign .line { border-top: 1px solid #9ca3af; padding-top: 4px; font-size: 10px; color: #6b7280; }
        .foot { margin-top: 26px; border-top: 1px solid #e5e7eb; padding-top: 10px; color: #9ca3af; font-size: 9px; }
        .muted { color: #9ca3af; }
    </style>
</head>
<body>
    <table class="head" width="100%">
        <tr>
            <td>
                @if(!empty($logo_data))
                    <img src="{{ $logo_data }}" alt="ePathways" style="height:80px; margin-bottom:4px;">
                @else
                    <div class="brand">ePathways.</div>
                @endif
                <div class="eyebrow" style="margin-top:4px;">Daily Time &amp; Task Record</div>
                <h1>Daily Report</h1>
            </td>
            <td style="text-align:right;">
                <div class="eyebrow">Date</div>
                <div style="font-size:15px; font-weight:bold; margin-top:2px;">{{ $prettyDate }}</div>
            </td>
        </tr>
    </table>

    <table class="meta" width="100%">
        <tr><td class="label">Employee</td><td class="value">{{ $name }}</td></tr>
        <tr><td class="label">Position</td><td>{{ $position ?: '—' }} <span class="muted">· {{ $employment }}</span></td></tr>
        <tr><td class="label">Team</td><td>{{ $team ?: '—' }} <span class="muted">({{ $timezone }})</span></td></tr>
        <tr><td class="label">Schedule</td><td>{{ $scheduleLabel }}</td></tr>
    </table>

    <table class="stats">
        <tr>
            <td><div class="k">Time In</div><div class="v">{{ $timeIn }}</div></td>
            <td><div class="k">Time Out</div><div class="v">{{ $timeOut }}</div></td>
            <td><div class="k">Net Hours</div><div class="v">{{ $netHrs }}</div></td>
        </tr>
        <tr>
            <td><div class="k">Variance</div><div class="v {{ str_starts_with($variance, '-') ? 'neg' : ($variance === '—' ? '' : 'pos') }}">{{ $variance }}</div></td>
            <td>
                <div class="k">Attendance</div>
                <div class="v">
                    @if($attendance === 'Late')<span class="pill late">Late</span>
                    @elseif($attendance === 'On Time')<span class="pill ontime">On Time</span>
                    @elseif($attendance === 'Flexi')<span class="pill flexi">Flexi</span>
                    @else <span class="muted">—</span>@endif
                </div>
            </td>
            <td><div class="k">Tasks Completed</div><div class="v">{{ count($completed) }}</div></td>
        </tr>
    </table>

    <div class="section-title">Completed tasks</div>
    <table class="tasks">
        <thead>
            <tr><th class="num">#</th><th>Task completed</th></tr>
        </thead>
        <tbody>
            @forelse($completed as $i => $t)
                <tr>
                    <td class="num">{{ $i + 1 }}</td>
                    <td>{{ $t }}</td>
                </tr>
            @empty
                <tr><td class="num">—</td><td class="muted">No tasks were completed this day.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="section-title">Pending / for tomorrow</div>
    <table class="tasks">
        <thead>
            <tr><th class="num">#</th><th>Carried over to the next day</th></tr>
        </thead>
        <tbody>
            @forelse($pending as $i => $t)
                <tr>
                    <td class="num">{{ $i + 1 }}</td>
                    <td>{{ $t }}</td>
                </tr>
            @empty
                <tr><td class="num">—</td><td class="muted">Nothing was carried over.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="section-title">Remarks</div>
    <div class="remarks">{{ $remarks ?: '—' }}</div>

    <table class="sign">
        <tr>
            <td><div class="line">Employee signature</div></td>
            <td><div class="line">Verified by (Manager / HR)</div></td>
        </tr>
    </table>

    <div class="foot">
        This report is a system-generated record of the employee's logged time and tasks for {{ $prettyDate }}.
        Generated {{ $generatedAt }} · ePathways Daily Time &amp; Task Record.
    </div>
</body>
</html>
