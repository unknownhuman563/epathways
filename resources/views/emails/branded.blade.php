<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>{{ $subjectLine ?? 'ePathways' }}</title>
</head>
<body style="margin:0; padding:0; background-color:#eef0f4; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
    @php
        use Illuminate\Support\Facades\Storage;

        // Optional per-template overrides fall back to the default ePathways
        // banner / footer artwork so every email is branded either way. Each
        // image is resolved to BOTH a local filesystem path (embedded inline
        // via $message->embed — renders without an external fetch) and a public
        // URL (used for the footer's background-image overlay, which some
        // clients only honour from a real URL).
        $bannerRel = ($bannerImage ?? null) && Storage::disk('public')->exists($bannerImage) ? $bannerImage : null;
        $footerRel = ($footerImage ?? null) && Storage::disk('public')->exists($footerImage) ? $footerImage : null;

        $bannerPath = $bannerRel ? Storage::disk('public')->path($bannerRel) : public_path('images/email/team-header.png');
        $footerPath = $footerRel ? Storage::disk('public')->path($footerRel) : public_path('images/coffee-cta.png');

        $siteUrl = rtrim(config('app.url'), '/');

        // Banner is embedded inline <img> (Gmail renders those reliably). The
        // footer has the CTA buttons baked into the pixels — Gmail allows no
        // HTML overlay, so this is the only way to show buttons "on" the image
        // (exactly how the original template did it). Any aspect ratio is fine.
        $banner = is_file($bannerPath) ? $message->embed($bannerPath) : null;
        $siteHost = preg_replace('#^https?://#', '', $siteUrl);
        $phone = config('services.contact.phone');
        $whatsapp = config('services.contact.whatsapp');
        $facebook = config('services.contact.facebook');
        $messenger = config('services.contact.messenger');
        $contactEmail = config('services.contact.email');

        $footerBytes = is_file($footerPath)
            ? app(\App\Services\EmailFooterComposer::class)->composeBytes($footerPath, 'BOOK NOW', $phone ? 'CALL '.$phone : null)
            : null;
    @endphp

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef0f4;">
        <tr>
            <td align="center" style="padding:24px 12px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:6px; overflow:hidden; font-family:'Segoe UI', Arial, Helvetica, sans-serif;">

                    {{-- Banner --}}
                    @if ($banner)
                    <tr>
                        <td style="padding:0; background-color:#ffffff;">
                            <img src="{{ $banner }}" alt="ePathways" width="600" style="display:block; width:100%; max-width:600px; height:auto; border:0;">
                        </td>
                    </tr>
                    @endif

                    {{-- Body --}}
                    <tr>
                        <td style="padding:30px 40px 10px 40px; font-size:14px; line-height:1.6; color:#333333;">
                            {!! $bodyHtml !!}
                        </td>
                    </tr>

                    {{-- Footer CTA — full-width consultation image with the two
                         CTA buttons baked into it (see $footerBytes above). The
                         whole image links to the booking page. --}}
                    @if ($footerBytes)
                    <tr>
                        <td style="padding:24px 0 0 0;">
                            <a href="{{ $siteUrl }}/booking" target="_blank">
                                <img src="{{ $message->embedData($footerBytes, 'footer.jpg', 'image/jpeg') }}" alt="Book your free consultation with ePathways" width="600" style="display:block; width:100%; max-width:600px; height:auto; border:0;">
                            </a>
                        </td>
                    </tr>
                    @endif

                    {{-- Social icons --}}
                    <tr>
                        <td style="padding:22px 40px 6px 40px;" align="center">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                    @if ($facebook)
                                    <td style="padding:0 5px;">
                                        <a href="{{ $facebook }}" target="_blank"><img src="{{ $message->embed(public_path('images/email/social/facebook.png')) }}" alt="Facebook" width="30" height="30" style="display:block; border:0;"></a>
                                    </td>
                                    @endif
                                    @if ($messenger)
                                    <td style="padding:0 5px;">
                                        <a href="{{ $messenger }}" target="_blank"><img src="{{ $message->embed(public_path('images/email/social/messenger.png')) }}" alt="Messenger" width="30" height="30" style="display:block; border:0;"></a>
                                    </td>
                                    @endif
                                    @if ($whatsapp)
                                    <td style="padding:0 5px;">
                                        <a href="https://wa.me/{{ preg_replace('/[^0-9]/', '', $whatsapp) }}" target="_blank"><img src="{{ $message->embed(public_path('images/email/social/whatsapp.png')) }}" alt="WhatsApp" width="30" height="30" style="display:block; border:0;"></a>
                                    </td>
                                    @endif
                                    <td style="padding:0 5px;">
                                        <a href="{{ $siteUrl }}" target="_blank"><img src="{{ $message->embed(public_path('images/email/social/website.png')) }}" alt="Website" width="30" height="30" style="display:block; border:0;"></a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Copyright --}}
                    <tr>
                        <td style="padding:10px 40px 4px 40px;" align="center">
                            <p style="margin:0; font-size:11px; color:#aaaaaa;">
                                Copyright &copy; {{ date('Y') }} ePathways. All rights reserved.
                            </p>
                        </td>
                    </tr>

                    {{-- Contact details --}}
                    <tr>
                        <td style="padding:14px 40px 30px 40px;" align="center">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                @if ($contactEmail)
                                <tr>
                                    <td align="center" style="padding:8px 0 0 0;">
                                        <p style="margin:0; font-size:12px; font-weight:700; color:#444444;">E-mail:</p>
                                        <a href="mailto:{{ $contactEmail }}" style="font-size:12px; color:#2e7d32; text-decoration:underline;">{{ $contactEmail }}</a>
                                    </td>
                                </tr>
                                @endif
                                @if ($whatsapp)
                                <tr>
                                    <td align="center" style="padding:8px 0 0 0;">
                                        <p style="margin:0; font-size:12px; font-weight:700; color:#444444;">Whatsapp:</p>
                                        <p style="margin:0; font-size:12px; color:#555555;">{{ $whatsapp }}</p>
                                    </td>
                                </tr>
                                @endif
                                <tr>
                                    <td align="center" style="padding:8px 0 0 0;">
                                        <p style="margin:0; font-size:12px; font-weight:700; color:#444444;">Website:</p>
                                        <a href="{{ $siteUrl }}" style="font-size:12px; color:#2e7d32; text-decoration:underline;">{{ $siteHost }}</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding:8px 0 0 0;">
                                        <p style="margin:0; font-size:12px; font-weight:700; color:#444444;">Location:</p>
                                        <p style="margin:0; font-size:12px; color:#2e7d32;">21 Vazey Way, Hobsonville, Auckland, 0618, New Zealand</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
