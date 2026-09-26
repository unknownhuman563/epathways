<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Your overdue tasks</title>
</head>
<body style="margin:0;padding:0;background-color:#eef0f4;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef0f4;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
<tr>
<td align="center" style="padding:28px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;">

{{-- Header --}}
<tr>
<td style="background-color:#1f7a43;padding:22px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">EP<span style="color:#86efac;">.</span></td>
<td align="right" style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.72);">Task Board</td>
</tr>
</table>
</td>
</tr>

{{-- Body --}}
<tr>
<td style="padding:32px 40px 8px 40px;">
<p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#dc2626;">Overdue tasks</p>
<p style="margin:0 0 4px;font-size:20px;font-weight:800;color:#0f172a;line-height:1.3;">Hi {{ $recipientName }}, you have {{ $count }} overdue {{ $count === 1 ? 'task' : 'tasks' }}.</p>
<p style="margin:0;font-size:14.5px;line-height:1.6;color:#64748b;">These are past their due date and still open. A quick review keeps everything on track.</p>

{{-- Task list --}}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 6px;">
@foreach($rows as $row)
<tr>
<td style="padding:0 0 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="border:1px solid #e8eaed;border-radius:12px;padding:16px 18px;background-color:#fbfcfd;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="vertical-align:top;">
<div style="font-size:15.5px;font-weight:700;color:#0f172a;line-height:1.4;">{{ $row['title'] }}</div>
<div style="margin-top:5px;font-size:12.5px;color:#64748b;">
<span style="color:#dc2626;font-weight:700;">&#9888;&nbsp; {{ $row['overdue'] }}</span>
<span style="color:#cbd5e1;">&nbsp;|&nbsp;</span>Due {{ $row['dueDisplay'] }}
@if($row['related'])
<span style="color:#cbd5e1;">&nbsp;|&nbsp;</span>{{ $row['related'] }}@if($row['relatedRef']) <span style="color:#94a3b8;">({{ $row['relatedRef'] }})</span>@endif
@elseif($row['department'])
<span style="color:#cbd5e1;">&nbsp;|&nbsp;</span>{{ $row['department'] }}
@endif
</div>
</td>
<td align="right" style="vertical-align:top;white-space:nowrap;padding-left:12px;">
<span style="display:inline-block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:{{ $row['priority']['fg'] }};background:{{ $row['priority']['bg'] }};border-radius:999px;padding:4px 10px;">{{ $row['priority']['label'] }}</span>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
@endforeach
</table>

{{-- CTA --}}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px 0 6px;">
<tr>
<td style="border-radius:10px;background-color:#1f7a43;">
<a href="{{ $url }}" target="_blank" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">Review my tasks &rarr;</a>
</td>
</tr>
</table>

<p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">You're receiving this daily digest because you have overdue tasks assigned to you in EP.</p>
</td>
</tr>

{{-- Footer --}}
<tr>
<td style="padding:20px 40px 28px 40px;border-top:1px solid #eef0f4;">
<p style="margin:0;font-size:11px;color:#9ca3af;">&copy; {{ date('Y') }} EP. All rights reserved.</p>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>
