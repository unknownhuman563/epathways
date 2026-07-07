<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking confirmation</title>
</head>
<body style="margin:0; padding:0; background-color:#eef0f4; font-family:'Segoe UI', Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef0f4;">
        <tr>
            <td align="center" style="padding:24px 12px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:8px; overflow:hidden;">

                    {{-- Header --}}
                    <tr>
                        <td style="background-color:#436235; padding:28px 32px;">
                            <p style="margin:0; color:#ffffff; font-size:20px; font-weight:700;">ePathways</p>
                            <p style="margin:4px 0 0; color:#dfe7d9; font-size:13px;">{{ $paid ? 'Payment received' : 'Booking received' }}</p>
                        </td>
                    </tr>

                    {{-- Body --}}
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 12px; font-size:16px; color:#111827;">Hi {{ $firstName }},</p>
                            <p style="margin:0 0 20px; font-size:14px; color:#4b5563; line-height:1.6;">
                                @if ($paid)
                                    Thank you — your consultation is <strong>confirmed and paid</strong>. Here are your booking details and invoice.
                                @else
                                    We've saved your consultation. It's currently <strong>not yet paid</strong> — you can complete payment anytime from the link we provided. Here are your details.
                                @endif
                            </p>

                            {{-- Details card --}}
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb; border-radius:8px;">
                                <tr><td style="padding:16px 20px;">
                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px; color:#374151;">
                                        <tr><td style="padding:6px 0; color:#9ca3af; width:130px;">Reference</td><td style="padding:6px 0; font-weight:600;">{{ $reference }}</td></tr>
                                        <tr><td style="padding:6px 0; color:#9ca3af;">Service</td><td style="padding:6px 0;">{{ $service ?: 'Consultation' }}</td></tr>
                                        @if ($visa)
                                        <tr><td style="padding:6px 0; color:#9ca3af;">Visa type</td><td style="padding:6px 0; font-weight:600;">{{ $visa }}</td></tr>
                                        @endif
                                        @if ($consultant)
                                        <tr><td style="padding:6px 0; color:#9ca3af;">Adviser</td><td style="padding:6px 0;">{{ $consultant }}</td></tr>
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

                            {{-- Invoice --}}
                            @if ($amount)
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px; border:1px solid #e5e7eb; border-radius:8px;">
                                <tr><td style="padding:16px 20px;">
                                    <p style="margin:0 0 10px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#9ca3af;">Invoice</p>
                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px; color:#374151;">
                                        <tr>
                                            <td style="padding:6px 0;">{{ $visa ?: 'Consultation' }} — consultation fee</td>
                                            <td align="right" style="padding:6px 0;">{{ $currency }} ${{ $amount }}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding:10px 0 0; border-top:1px solid #e5e7eb; font-weight:700;">Total</td>
                                            <td align="right" style="padding:10px 0 0; border-top:1px solid #e5e7eb; font-weight:700;">{{ $currency }} ${{ $amount }}</td>
                                        </tr>
                                    </table>
                                    <p style="margin:12px 0 0; font-size:13px;">
                                        Payment status:
                                        <strong style="color:{{ $paid ? '#059669' : '#d97706' }};">{{ $paid ? 'Paid' : 'Not yet paid' }}</strong>
                                    </p>
                                </td></tr>
                            </table>
                            @endif

                            <p style="margin:24px 0 0; font-size:14px; color:#4b5563; line-height:1.6;">
                                We'll be in touch before your session. If you need to reschedule or have questions, just reply to this email.
                            </p>
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td style="padding:20px 32px; background-color:#f9fafb; border-top:1px solid #eef0f4;">
                            <p style="margin:0; font-size:12px; color:#9ca3af;">
                                ePathways · <a href="{{ $siteUrl }}" style="color:#436235; text-decoration:none;">{{ preg_replace('#^https?://#', '', $siteUrl) }}</a>
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
