<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weekly Daily Time Records</title>
</head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding:28px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e5e7eb;">
                    <tr>
                        <td style="background:#436235; padding:22px 32px;">
                            <div style="color:#ffffff; font-size:18px; font-weight:700; letter-spacing:-0.3px;">ePathways</div>
                            <div style="color:#c7d6bd; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; margin-top:3px;">Daily Time &amp; Task Records</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 16px; font-size:15px; color:#111827;">Hi {{ $greeting }},</p>

                            <p style="margin:0 0 16px; font-size:15px; color:#374151;">Good day!</p>

                            <p style="margin:0 0 16px; font-size:15px; color:#374151; line-height:1.6;">
                                Please see attached the Daily Time Records (DTR) of each staff member from
                                <strong>{{ $teamLabel }}</strong> covering the day
                                <strong>{{ $rangeLabel }}</strong> for your reference and review.
                            </p>

                            <p style="margin:0 0 16px; font-size:15px; color:#374151; line-height:1.6;">
                                The attached DTRs include each staff member&rsquo;s attendance and recorded
                                working hours for the dates indicated.
                            </p>

                            @if(!empty($note))
                                <p style="margin:0 0 16px; font-size:15px; color:#374151; line-height:1.6;">{{ $note }}</p>
                            @endif

                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                                <tr>
                                    <td style="background:#eef2ea; border:1px solid #d7e2cd; border-radius:10px; padding:12px 16px;">
                                        <span style="font-size:20px; vertical-align:middle;">&#128206;</span>
                                        <span style="font-size:13px; color:#436235; font-weight:700; vertical-align:middle; margin-left:6px;">Weekly DTR attached (PDF)</span>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:0 0 4px; font-size:15px; color:#374151;">Thank you!</p>
                            <p style="margin:16px 0 0; font-size:15px; color:#374151;">Best,<br><strong>ePathways</strong></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f9fafb; border-top:1px solid #e5e7eb; padding:16px 32px; color:#9ca3af; font-size:11px; line-height:1.6;">
                            This is a system-generated report from the ePathways Daily Time &amp; Task Record.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
