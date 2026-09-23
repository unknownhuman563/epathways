<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; background:#f3f4f6; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding:24px 0;">
        <tr><td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.08);">
                <tr><td style="background:#1F5A8B; padding:20px 28px; color:#ffffff; font-size:18px; font-weight:700;">
                    Exalt Property Management
                </td></tr>
                <tr><td style="padding:28px;">
                    <p style="margin:0 0 14px; font-size:15px;">Hi {{ $clientName ?: 'there' }},</p>
                    <p style="margin:0 0 14px; font-size:14px; line-height:1.6;">
                        Your <strong>{{ $agreementLabel }}</strong> is ready. Please review it and add your signature
                        using the secure link below.
                    </p>
                    <p style="margin:24px 0; text-align:center;">
                        <a href="{{ $signUrl }}" style="display:inline-block; background:#1F5A8B; color:#ffffff; text-decoration:none; font-weight:700; font-size:15px; padding:12px 28px; border-radius:8px;">
                            Review &amp; sign your agreement
                        </a>
                    </p>
                    <p style="margin:0 0 14px; font-size:13px; line-height:1.6; color:#6b7280;">
                        If the button doesn't work, copy and paste this link into your browser:<br>
                        <a href="{{ $signUrl }}" style="color:#1F5A8B; word-break:break-all;">{{ $signUrl }}</a>
                    </p>
                    <p style="margin:18px 0 0; font-size:14px;">Ngā mihi,<br>Exalt Property Management Ltd</p>
                </td></tr>
                <tr><td style="padding:16px 28px; background:#f9fafb; color:#9ca3af; font-size:12px;">
                    exaltinfo@epathways.co.nz · +64 21 227 8999
                </td></tr>
            </table>
        </td></tr>
    </table>
</body>
</html>
