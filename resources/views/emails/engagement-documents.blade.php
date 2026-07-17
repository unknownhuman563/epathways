<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Your engagement documents are ready</title>
</head>
<body style="margin:0; padding:0; background-color:#eef0f4; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
    @php
        // Every image is a PUBLIC URL (plain <img src>), never embedded —
        // CID/inline embeds surface as "attachments" in Gmail. On a public
        // domain Gmail loads them inline with no attachment.
        $siteUrl  = rtrim(config('app.url'), '/');
        $siteHost = preg_replace('#^https?://#', '', $siteUrl);
        $img      = $siteUrl.'/images/email/engagement';

        $teal = '#137C86';

        $phone        = config('services.contact.phone');
        $whatsapp     = config('services.contact.whatsapp');
        $facebook     = config('services.contact.facebook');
        $contactEmail = config('services.contact.email');
    @endphp

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef0f4;">
        <tr>
            <td align="center" style="padding:24px 12px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:6px; overflow:hidden; font-family:'Segoe UI', Arial, Helvetica, sans-serif;">

                    {{-- Banner --}}
                    <tr>
                        <td style="padding:0; background-color:#ffffff;">
                            <img src="{{ $img }}/banner.png" alt="ePathways Migration" width="600" style="display:block; width:100%; max-width:600px; height:auto; border:0;">
                        </td>
                    </tr>

                    {{-- Greeting + intro --}}
                    <tr>
                        <td style="padding:30px 40px 6px 40px; font-size:14px; line-height:1.6; color:#333333;">
                            <p style="margin:0 0 16px;">Dear <strong style="text-transform:uppercase;">{{ $firstName }}</strong>,</p>
                            <p style="margin:0 0 14px;">
                                Thank you for choosing D Immigration Consultancy Limited to assist you with your
                                New Zealand visa application.
                            </p>
                            <p style="margin:0;">
                                We're delighted to have you with us and look forward to guiding you through every
                                step of the process. Our commitment is to provide you with clear advice, honest
                                communication, and professional support throughout your immigration journey.
                            </p>
                        </td>
                    </tr>

                    {{-- Section heading --}}
                    <tr>
                        <td style="padding:24px 40px 4px 40px;">
                            <p style="margin:0; font-size:15px; font-weight:700; color:{{ $teal }};">
                                To formally begin your engagement, please find the following documents attached:
                            </p>
                        </td>
                    </tr>

                    {{-- Document icon grid (2 per row) --}}
                    <tr>
                        <td style="padding:14px 28px 8px 28px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                @foreach (array_chunk($cards, 2) as $row)
                                <tr>
                                    @foreach ($row as $card)
                                    <td width="50%" valign="top" align="center" style="padding:14px 12px;">
                                        <a href="{{ $card['url'] }}" target="_blank" style="text-decoration:none; color:{{ $teal }};">
                                            <img src="{{ $img }}/{{ $card['icon'] }}" alt="{{ $card['title'] }}" width="96" height="96" style="display:block; margin:0 auto 10px; width:96px; height:96px; border:0;">
                                            <span style="display:block; font-size:13px; font-weight:700; line-height:1.4; color:{{ $teal }};">{{ $card['title'] }}</span>
                                        </a>
                                    </td>
                                    @endforeach
                                    @if (count($row) === 1)
                                    <td width="50%"></td>
                                    @endif
                                </tr>
                                @endforeach
                            </table>
                        </td>
                    </tr>

                    {{-- Closing copy --}}
                    <tr>
                        <td style="padding:14px 40px 4px 40px; font-size:13px; line-height:1.7; color:#555555;">
                            <p style="margin:0 0 14px;">
                                Please take a few moments to read these documents. You can open them any time on
                                your personal application tracker using the button below — no login required.
                            </p>
                        </td>
                    </tr>

                    {{-- CTA button --}}
                    <tr>
                        <td align="center" style="padding:6px 40px 8px 40px;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="background-color:{{ $teal }}; border-radius:6px;">
                                        <a href="{{ $trackUrl }}" target="_blank" style="display:inline-block; padding:13px 30px; font-size:14px; font-weight:700; color:#ffffff; text-decoration:none;">Open my documents</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:8px 40px 6px 40px; font-size:12px; line-height:1.6; color:#888888;">
                            <p style="margin:0 0 12px;">
                                Once you're happy to proceed, please sign and return the Engagement Agreement. Upon
                                receipt, we'll provide you with the next steps and a personalised document checklist
                                so we can begin preparing your visa application.
                            </p>
                            <p style="margin:0;">
                                Thank you again for placing your trust in us. We look forward to helping you achieve
                                your New Zealand goals.
                            </p>
                        </td>
                    </tr>

                    {{-- Divider --}}
                    <tr>
                        <td style="padding:20px 40px 0 40px;">
                            <div style="border-top:1px solid #eef0f4; line-height:1px; font-size:1px;">&nbsp;</div>
                        </td>
                    </tr>

                    {{-- Footer logo --}}
                    <tr>
                        <td align="center" style="padding:22px 40px 6px 40px;">
                            <img src="{{ $img }}/logo.png" alt="ePathways Migration" width="220" style="display:block; width:220px; max-width:60%; height:auto; border:0;">
                        </td>
                    </tr>

                    {{-- Facebook --}}
                    @if ($facebook)
                    <tr>
                        <td align="center" style="padding:4px 40px 6px 40px;">
                            <a href="{{ $facebook }}" target="_blank"><img src="{{ $siteUrl }}/images/email/social/facebook.png" alt="Facebook" width="28" height="28" style="display:block; border:0;"></a>
                        </td>
                    </tr>
                    @endif

                    {{-- Copyright --}}
                    <tr>
                        <td align="center" style="padding:6px 40px 2px 40px;">
                            <p style="margin:0; font-size:11px; color:#aaaaaa;">Copyright &copy; {{ date('Y') }} ePathways. All rights reserved.</p>
                        </td>
                    </tr>

                    {{-- Contact details --}}
                    <tr>
                        <td align="center" style="padding:10px 40px 30px 40px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding:6px 0 0 0;">
                                        <p style="margin:0; font-size:12px; font-weight:700; color:#444444;">Website:</p>
                                        <a href="{{ $siteUrl }}" style="font-size:12px; color:{{ $teal }}; text-decoration:underline;">{{ $siteHost }}</a>
                                    </td>
                                </tr>
                                @if ($contactEmail)
                                <tr>
                                    <td align="center" style="padding:8px 0 0 0;">
                                        <p style="margin:0; font-size:12px; font-weight:700; color:#444444;">E-mail:</p>
                                        <a href="mailto:{{ $contactEmail }}" style="font-size:12px; color:{{ $teal }}; text-decoration:underline;">{{ $contactEmail }}</a>
                                    </td>
                                </tr>
                                @endif
                                <tr>
                                    <td align="center" style="padding:8px 0 0 0;">
                                        <p style="margin:0; font-size:12px; font-weight:700; color:#444444;">Location:</p>
                                        <p style="margin:0; font-size:12px; color:{{ $teal }};">Auckland, New Zealand</p>
                                    </td>
                                </tr>
                                @if ($whatsapp)
                                <tr>
                                    <td align="center" style="padding:8px 0 0 0;">
                                        <p style="margin:0; font-size:12px; font-weight:700; color:#444444;">Whatsapp:</p>
                                        <p style="margin:0; font-size:12px; color:#555555;">{{ $whatsapp }}</p>
                                    </td>
                                </tr>
                                @endif
                            </table>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
