<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Takes ONLY the public application tracker (`/track/*`) offline, leaving the
 * rest of the site up. Independent of full maintenance mode — used e.g. while
 * migrating tracker documents off the public disk so no new client uploads
 * land there mid-migration.
 *
 * Super-admin controls the switch on the Maintenance screen. Default is ON
 * (absent setting → tracker available), so it fails open: a missing or
 * corrupted row never silently disables a live client surface.
 *
 * Only the PUBLIC (anonymous) tracker is taken offline. Authenticated users —
 * a lead in their portal, or staff — always pass through, because the lead
 * portal reuses these `/track/*` endpoints for uploads; otherwise toggling the
 * public tracker off would also block signed-in clients from uploading.
 */
class EnsureTrackerEnabled
{
    public const SETTING_KEY = 'tracker.enabled';

    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check() || (bool) Setting::get(self::SETTING_KEY, true)) {
            return $next($request);
        }

        return response()
            ->view('tracker-unavailable', [], 503)
            ->header('Retry-After', '3600');
    }
}
