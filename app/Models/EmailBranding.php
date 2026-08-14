<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Per-department email banner + CTA, managed in the admin UI. Resolution for any
 * branding key is: uploaded image here → file asset in config/email_branding.php
 * → the global default ePathways artwork.
 */
class EmailBranding extends Model
{
    protected $fillable = ['department', 'banner_path', 'footer_path', 'booking_url', 'call_number', 'hide_banner', 'hide_footer'];

    protected $casts = [
        'hide_banner' => 'boolean',
        'hide_footer' => 'boolean',
    ];

    public function getBannerUrlAttribute(): ?string
    {
        return $this->banner_path && Storage::disk('public')->exists($this->banner_path)
            ? self::abs(Storage::disk('public')->url($this->banner_path)) : null;
    }

    public function getFooterUrlAttribute(): ?string
    {
        return $this->footer_path && Storage::disk('public')->exists($this->footer_path)
            ? self::abs(Storage::disk('public')->url($this->footer_path)) : null;
    }

    private static function abs(string $url): string
    {
        return Str::startsWith($url, ['http://', 'https://'])
            ? $url
            : rtrim((string) config('app.url'), '/').'/'.ltrim($url, '/');
    }

    private static function absPublic(string $rel): string
    {
        return rtrim((string) config('app.url'), '/').'/'.ltrim($rel, '/');
    }

    /**
     * Resolve the banner + CTA to use for a branding key.
     *
     * @return array{bannerUrl: string, footerUrl: string, footerPath: string}
     */
    public static function resolveAssets(?string $key): array
    {
        $key = $key ?: 'default';
        $cfg = config("email_branding.$key") ?: config('email_branding.default', []);
        $default = config('email_branding.default', []);
        $row = static::where('department', $key)->first();

        // Hidden = the email renders no banner / no CTA for this department.
        $bannerHidden = (bool) ($row?->hide_banner);
        $footerHidden = (bool) ($row?->hide_footer);

        // Banner (URL only) — DB upload → config asset → default artwork.
        if ($bannerHidden) {
            $bannerUrl = null;
        } elseif ($row && $row->banner_path && Storage::disk('public')->exists($row->banner_path)) {
            $bannerUrl = self::abs(Storage::disk('public')->url($row->banner_path));
        } elseif (($cfg['banner'] ?? null) && is_file(public_path($cfg['banner']))) {
            $bannerUrl = self::absPublic($cfg['banner']);
        } elseif (($default['banner'] ?? null) && is_file(public_path($default['banner']))) {
            $bannerUrl = self::absPublic($default['banner']);
        } else {
            $bannerUrl = self::absPublic('images/email/team-header.png');
        }

        // Footer/CTA — needs both a URL (preview) and a filesystem path (the
        // email bakes the BOOK NOW / CALL buttons onto the pixels).
        if ($footerHidden) {
            $footerPath = null;
            $footerUrl = null;
        } elseif ($row && $row->footer_path && Storage::disk('public')->exists($row->footer_path)) {
            $footerPath = Storage::disk('public')->path($row->footer_path);
            $footerUrl = self::abs(Storage::disk('public')->url($row->footer_path));
        } elseif (($cfg['footer'] ?? null) && is_file(public_path($cfg['footer']))) {
            $footerPath = public_path($cfg['footer']);
            $footerUrl = self::absPublic($cfg['footer']);
        } elseif (($default['footer'] ?? null) && is_file(public_path($default['footer']))) {
            $footerPath = public_path($default['footer']);
            $footerUrl = self::absPublic($default['footer']);
        } else {
            $footerPath = public_path('images/coffee-cta.png');
            $footerUrl = self::absPublic('images/coffee-cta.png');
        }

        // CTA button links: the BOOK NOW destination and the CALL number baked
        // onto the footer — per-department override, else the global contact config.
        $bookingUrl = ($row?->booking_url) ?: (config('services.contact.booking_url') ?: rtrim((string) config('app.url'), '/').'/booking');
        $callNumber = ($row?->call_number) ?: config('services.contact.phone');

        return compact('bannerUrl', 'footerUrl', 'footerPath', 'bookingUrl', 'callNumber');
    }
}
