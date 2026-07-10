<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Viewing request received</title>
</head>
<body style="margin:0; padding:0; background-color:#eef0f4; font-family:'Segoe UI', Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef0f4;">
        <tr>
            <td align="center" style="padding:24px 12px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:8px; overflow:hidden;">

                    {{-- Header --}}
                    <tr>
                        <td style="background-color:#1F5A8B; padding:28px 32px;">
                            <p style="margin:0; color:#ffffff; font-size:20px; font-weight:700;">ePathways</p>
                            <p style="margin:4px 0 0; color:#d6e2ee; font-size:13px;">Accommodation — viewing request received</p>
                        </td>
                    </tr>

                    {{-- Body --}}
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 12px; font-size:16px; color:#111827;">Hi {{ $firstName }},</p>
                            <p style="margin:0 0 20px; font-size:14px; color:#4b5563; line-height:1.6;">
                                Thanks — we've received your request to view
                                @if ($property)<strong>{{ $property }}</strong>@else this property @endif.
                                Our accommodation team will be in touch to confirm the details. Here's a summary of your request.
                            </p>

                            {{-- Details card --}}
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb; border-radius:8px;">
                                <tr><td style="padding:16px 20px;">
                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px; color:#374151;">
                                        <tr><td style="padding:6px 0; color:#9ca3af; width:130px;">Reference</td><td style="padding:6px 0; font-weight:600;">{{ $reference }}</td></tr>
                                        @if ($property)
                                        <tr><td style="padding:6px 0; color:#9ca3af;">Property</td><td style="padding:6px 0; font-weight:600;">{{ $property }}</td></tr>
                                        @endif
                                        @if ($propertyLocation)
                                        <tr><td style="padding:6px 0; color:#9ca3af;">Location</td><td style="padding:6px 0;">{{ $propertyLocation }}</td></tr>
                                        @endif
                                        <tr><td style="padding:6px 0; color:#9ca3af;">Date</td><td style="padding:6px 0;">{{ $dateLine ?: 'To be confirmed' }}</td></tr>
                                        @if ($timeLine)
                                        <tr><td style="padding:6px 0; color:#9ca3af;">Time (NZ)</td><td style="padding:6px 0;">{{ $timeLine }}</td></tr>
                                        @endif
                                        @if (! empty($clientTime))
                                        <tr><td style="padding:6px 0; color:#9ca3af;">Your local time</td><td style="padding:6px 0; font-weight:600;">{{ $clientTime }}<span style="color:#9ca3af; font-weight:400;"> ({{ $clientTz }})</span></td></tr>
                                        @endif
                                    </table>
                                </td></tr>
                            </table>

                            <p style="margin:24px 0 0; font-size:14px; color:#4b5563; line-height:1.6;">
                                Need to change the time or have a question? Just reply to this email and we'll help.
                            </p>
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td style="padding:20px 32px; background-color:#f9fafb; border-top:1px solid #eef0f4;">
                            <p style="margin:0; font-size:12px; color:#9ca3af;">
                                ePathways · <a href="{{ $siteUrl }}" style="color:#1F5A8B; text-decoration:none;">{{ preg_replace('#^https?://#', '', $siteUrl) }}</a>
                                @if ($contactEmail) · {{ $contactEmail }} @endif
                                @if ($phone) · {{ $phone }} @endif
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
