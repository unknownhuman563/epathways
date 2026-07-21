<?php

namespace App\Services;

use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Support\Str;

/**
 * Maintenance mode for the PUBLIC site only.
 *
 * Deliberately NOT Laravel's `php artisan down` — that 503s every route
 * including /login and the admin screen used to turn it back off, which
 * risks locking the team out of a live box. This is a DB-flag instead, so
 * staff portals and /admin keep working while the marketing site is dark.
 * The response is still a real 503 + Retry-After so search engines treat
 * it as temporary and don't de-index the site.
 *
 * State is either a manual toggle or a scheduled window; whichever says
 * "down" wins.
 */
class MaintenanceMode
{
    public const KEY_ENABLED = 'maintenance.enabled';

    public const KEY_MESSAGE = 'maintenance.message';

    public const KEY_ETA = 'maintenance.eta';

    public const KEY_BYPASS = 'maintenance.bypass_token';

    public const KEY_STARTS_AT = 'maintenance.starts_at';

    public const KEY_ENDS_AT = 'maintenance.ends_at';

    /** Cookie set once a valid bypass token is presented. */
    public const BYPASS_COOKIE = 'epw_maintenance_bypass';

    public const DEFAULT_MESSAGE = "We're carrying out scheduled maintenance and will be back shortly. Thanks for your patience.";

    /**
     * Is the public site currently down? True when the manual toggle is on
     * OR we're inside the scheduled window.
     */
    public static function isActive(): bool
    {
        return self::manualEnabled() || self::inScheduledWindow();
    }

    public static function manualEnabled(): bool
    {
        return (bool) Setting::get(self::KEY_ENABLED, false);
    }

    /**
     * Inside the scheduled window? A window needs BOTH ends to be meaningful;
     * a half-filled window is ignored rather than assumed open-ended, so a
     * stray start date can never take the site down indefinitely.
     */
    public static function inScheduledWindow(): bool
    {
        [$start, $end] = self::window();

        if (! $start || ! $end) {
            return false;
        }

        return now()->betweenIncluded($start, $end);
    }

    /** @return array{0: ?Carbon, 1: ?Carbon} */
    public static function window(): array
    {
        return [
            self::parseDate(Setting::get(self::KEY_STARTS_AT)),
            self::parseDate(Setting::get(self::KEY_ENDS_AT)),
        ];
    }

    private static function parseDate(mixed $raw): ?Carbon
    {
        $raw = is_string($raw) ? trim($raw) : $raw;

        if (blank($raw)) {
            return null;
        }

        try {
            return Carbon::parse($raw);
        } catch (\Throwable) {
            // A malformed stored date must never take the site down.
            return null;
        }
    }

    public static function message(): string
    {
        $msg = Setting::get(self::KEY_MESSAGE);

        return filled($msg) ? (string) $msg : self::DEFAULT_MESSAGE;
    }

    /** Optional "back by" time shown to visitors. Null when not set. */
    public static function eta(): ?Carbon
    {
        return self::parseDate(Setting::get(self::KEY_ETA));
    }

    public static function bypassToken(): ?string
    {
        $token = Setting::get(self::KEY_BYPASS);

        return filled($token) ? (string) $token : null;
    }

    /** Mint (and persist) a fresh bypass token, invalidating the old link. */
    public static function regenerateBypassToken(): string
    {
        $token = Str::random(40);

        Setting::set(self::KEY_BYPASS, $token, 'string', 'Maintenance bypass token', 'maintenance');

        return $token;
    }

    /** Full shareable preview URL, or null when no token exists yet. */
    public static function bypassUrl(): ?string
    {
        $token = self::bypassToken();

        return $token ? url('/?bypass='.$token) : null;
    }

    /**
     * Seconds until the site is expected back — feeds the Retry-After header.
     * Falls back to an hour when we have no end time to work from.
     */
    public static function retryAfterSeconds(): int
    {
        [, $end] = self::window();
        $target = $end ?? self::eta();

        if ($target && $target->isFuture()) {
            return max(60, $target->diffInSeconds(now()));
        }

        return 3600;
    }
}
