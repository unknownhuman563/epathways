<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Weekly Time Records — {{ $rangeLabel }}</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; color: #1f2937; font-size: 11px; margin: 0; padding: 34px 38px; }
        .brand { color: #436235; font-weight: bold; font-size: 20px; letter-spacing: -0.5px; }
        .eyebrow { color: #9ca3af; font-size: 9px; font-weight: bold; letter-spacing: 2.5px; text-transform: uppercase; }
        .head { border-bottom: 2px solid #436235; padding-bottom: 14px; margin-bottom: 18px; }
        .head td { vertical-align: top; }
        h1 { font-size: 17px; margin: 2px 0 0; }
        .team-title { font-size: 12px; font-weight: bold; color: #436235; text-transform: uppercase; letter-spacing: 1.5px; margin: 22px 0 10px; border-bottom: 1px solid #d7e2cd; padding-bottom: 5px; }
        .staff { margin-bottom: 16px; page-break-inside: avoid; }
        .staff-head { margin-bottom: 5px; }
        .staff-name { font-size: 13px; font-weight: bold; color: #111827; }
        .staff-meta { color: #6b7280; font-size: 10px; }
        table.wk { width: 100%; border-collapse: collapse; }
        table.wk th { background: #f3f4f6; border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; }
        table.wk td { border: 1px solid #e5e7eb; padding: 6px 8px; vertical-align: middle; }
        table.wk td.c { text-align: center; }
        table.wk td.r { text-align: right; }
        .day { font-weight: bold; color: #374151; }
        .pill { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 9px; font-weight: bold; }
        .pill.ontime { background: #d1fae5; color: #047857; }
        .pill.late { background: #ffe4e6; color: #be123c; }
        .pill.flexi { background: #e0e7ff; color: #4338ca; }
        .pill.leave { background: #e0e7ff; color: #4338ca; }
        .pill.off { background: #f3f4f6; color: #9ca3af; }
        .muted { color: #b0b6be; }
        .taskrow td { border: 1px solid #e5e7eb; border-top: none; padding: 5px 10px 7px 10px; background: #fcfcfd; }
        .tasklabel { font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; margin-bottom: 2px; }
        .tk { color: #374151; font-size: 10px; padding: 1px 0; }
        .tk.side { color: #6b7280; padding-left: 16px; font-size: 9.5px; }
        .totrow td { background: #f9fafb; font-weight: bold; color: #111827; border-top: 2px solid #d1d5db; }
        .foot { margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 10px; color: #9ca3af; font-size: 9px; }
        .empty { border: 1px solid #e5e7eb; border-radius: 6px; padding: 18px; text-align: center; color: #9ca3af; }
    </style>
</head>
<body>
    <table class="head" width="100%">
        <tr>
            <td>
                @if(!empty($logo_data))
                    <img src="{{ $logo_data }}" alt="ePathways" style="height:74px; margin-bottom:4px;">
                @else
                    <div class="brand">ePathways.</div>
                @endif
                <div class="eyebrow" style="margin-top:4px;">Daily Time &amp; Task Records</div>
                <h1>Weekly Time Records</h1>
            </td>
            <td style="text-align:right;">
                <div class="eyebrow">Week</div>
                <div style="font-size:14px; font-weight:bold; margin-top:2px;">{{ $rangeLabel }}</div>
                <div class="staff-meta" style="margin-top:6px;">{{ $teamLabel }} &middot; {{ $staffCount }} staff</div>
            </td>
        </tr>
    </table>

    @if($staffCount === 0)
        <div class="empty">No staff records for this week and team.</div>
    @endif

    @foreach($teams as $team)
        <div class="team-title">{{ $team['team'] }} &mdash; {{ count($team['staff']) }} staff</div>

        @foreach($team['staff'] as $s)
            <div class="staff">
                <div class="staff-head">
                    <span class="staff-name">{{ $s['name'] }}</span>
                    <span class="staff-meta">
                        @if($s['position']) &middot; {{ $s['position'] }} @endif
                        @if($s['timezone']) &middot; {{ $s['timezone'] }} @endif
                    </span>
                </div>
                <table class="wk">
                    <thead>
                        <tr>
                            <th style="width:15%;">Day</th>
                            <th style="width:17%;">Date</th>
                            <th style="width:19%;">Time In</th>
                            <th style="width:19%;">Time Out</th>
                            <th style="width:13%;">Net Hrs</th>
                            <th style="width:17%;">Attendance</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($s['rows'] as $row)
                            <tr>
                                <td class="day">{{ $row['dow'] }}</td>
                                <td>{{ $row['label'] }}</td>
                                @if($row['on_leave'])
                                    <td class="c" colspan="3"><span class="pill leave">On leave &middot; {{ $row['on_leave'] }}</span></td>
                                @elseif($row['off'] && $row['net_hrs'] === '—')
                                    <td class="c" colspan="3"><span class="pill off">Day off</span></td>
                                @else
                                    <td>{{ $row['time_in'] }}</td>
                                    <td>{{ $row['time_out'] }}</td>
                                    <td class="r">{{ $row['net_hrs'] }}</td>
                                @endif
                                <td class="c">
                                    @if($row['attendance'] === 'Late')<span class="pill late">Late</span>
                                    @elseif($row['attendance'] === 'On Time')<span class="pill ontime">On Time</span>
                                    @elseif($row['attendance'] === 'Flexi')<span class="pill flexi">Flexi</span>
                                    @else<span class="muted">&mdash;</span>@endif
                                </td>
                            </tr>
                            @if(!empty($row['tasks']))
                                <tr class="taskrow">
                                    <td colspan="6">
                                        <div class="tasklabel">{{ $row['dow'] }} &middot; Tasks</div>
                                        @foreach($row['tasks'] as $t)
                                            <div class="tk {{ $t['side'] ? 'side' : '' }}">{{ $t['side'] ? '↳' : '•' }} {{ $t['text'] }}</div>
                                        @endforeach
                                    </td>
                                </tr>
                            @endif
                        @endforeach
                        <tr class="totrow">
                            <td colspan="4" class="r">Week total &middot; {{ $s['days_worked'] }} day(s)</td>
                            <td class="r">{{ $s['total_hrs'] }}</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        @endforeach
    @endforeach

    <div class="foot">
        System-generated weekly Daily Time Records covering {{ $rangeLabel }}.
        Generated {{ $generatedAt }} &middot; ePathways Daily Time &amp; Task Record.
    </div>
</body>
</html>
