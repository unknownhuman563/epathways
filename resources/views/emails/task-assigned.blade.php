<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>New task assigned</title>
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
<p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#1f7a43;">You've got a new task</p>
<p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">Hi {{ $recipientName }}, <strong style="color:#111827;">{{ $assignedBy }}</strong> just assigned you a task &mdash; here's everything you need.</p>

{{-- Task card --}}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 10px;">
<tr>
<td style="border:1px solid #e8eaed;border-radius:14px;padding:24px 26px;background-color:#fbfcfd;">
<div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#1f7a43;">Task</div>
<div style="font-size:21px;font-weight:800;color:#0f172a;line-height:1.3;margin:6px 0 10px;">{{ $title }}</div>
<span style="display:inline-block;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:{{ $priority['fg'] }};background:{{ $priority['bg'] }};border-radius:999px;padding:5px 13px;">{{ $priority['label'] }} priority</span>
@if($description)
<p style="font-size:14.5px;line-height:1.65;color:#374151;margin:18px 0 0;">{{ $description }}</p>
@endif
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border-top:1px solid #f1f5f9;">
<tr>
<td style="padding:14px 0 6px;color:#64748b;font-size:13px;width:120px;vertical-align:top;">Due</td>
<td style="padding:14px 0 6px;font-size:14.5px;font-weight:700;color:#0f172a;">{{ $dueDisplay }}</td>
</tr>
@if($department)
<tr>
<td style="padding:6px 0;color:#64748b;font-size:13px;vertical-align:top;">Department</td>
<td style="padding:6px 0;font-size:14.5px;font-weight:700;color:#0f172a;">{{ $department }}</td>
</tr>
@endif
@if($related)
<tr>
<td style="padding:6px 0;color:#64748b;font-size:13px;vertical-align:top;">Related to</td>
<td style="padding:6px 0;font-size:14.5px;font-weight:700;color:#0f172a;">{{ $related }}@if($relatedRef) <span style="color:#94a3b8;font-weight:500;">&middot; {{ $relatedRef }}</span>@endif</td>
</tr>
@endif
</table>
@if(count($attachedNames) || count($tooLargeNames))
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-top:1px solid #f1f5f9;">
<tr>
<td style="padding-top:14px;">
<div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9ca3af;margin-bottom:8px;">Attachments</div>
@foreach($attachedNames as $name)
<div style="font-size:13.5px;color:#334155;padding:3px 0;">&#128206;&nbsp; {{ $name }} <span style="color:#16a34a;font-weight:700;">&mdash; attached</span></div>
@endforeach
@foreach($tooLargeNames as $name)
<div style="font-size:13.5px;color:#334155;padding:3px 0;">&#128206;&nbsp; {{ $name }} <span style="color:#94a3b8;">&mdash; too large to attach, open it in the app</span></div>
@endforeach
</td>
</tr>
</table>
@endif
</td>
</tr>
</table>

{{-- CTA --}}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 6px;">
<tr>
<td style="border-radius:10px;background-color:#1f7a43;">
<a href="{{ $url }}" target="_blank" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">Open the task board &rarr;</a>
</td>
</tr>
</table>

<p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">You're receiving this because you're assigned to this task in EP.</p>
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
