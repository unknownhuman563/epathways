<?php

namespace App\Http\Middleware;

use App\Services\MaintenanceMode;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Symfony\Component\HttpFoundation\Response;

/**
 * Serves the maintenance page for PUBLIC visitors while leaving every
 * staff/admin surface reachable, so the team is never locked out of the
 * screen that turns maintenance back off.
 *
 * Order of checks is deliberate: the always-allow path list is evaluated
 * before anything else, so even a corrupted settings row can't take out
 * /login or /admin.
 */
class EnsureNotInMaintenance
{
    /**
     * Paths that must NEVER show the maintenance page.
     *
     * - auth routes: staff have to be able to log in and fix things
     * - admin/portal: the whole point — internal work continues
     * - webhooks: Stripe/Zernio/calendar retries must not get a 503 and
     *   be marked failed by the sender
     * - up: the health check the platform polls
     */
    private const ALWAYS_ALLOW = [
        'login',
        'logout',
        'forgot-password',
        'reset-password',
        'reset-password/*',
        'lead-portal/setup/*',
        'admin',
        'admin/*',
        'portal',
        'portal/*',
        'api',
        'api/*',
        'up',
        'stripe/webhook',
        'webhook/*',
        'storage/*',
        'build/*',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->is(self::ALWAYS_ALLOW)) {
            return $next($request);
        }

        if (! MaintenanceMode::isActive()) {
            return $next($request);
        }

        // Deliberately NO automatic pass-through for signed-in staff. If admins
        // silently saw the real site they could never confirm maintenance was
        // actually working — it looks broken while visitors are correctly
        // blocked. Previewing is opt-in via the bypass link below.
        //
        // This does NOT risk a lockout: /login, /admin/* and /portal/* are in
        // the always-allow list above, so staff always reach their own screens.

        // ?bypass=<token> mints a cookie so testers can browse normally
        // for the rest of the window without re-appending the token.
        $token = MaintenanceMode::bypassToken();
        if ($token) {
            if (hash_equals($token, (string) $request->query('bypass'))) {
                Cookie::queue(MaintenanceMode::BYPASS_COOKIE, $token, 720);

                return $next($request);
            }

            if (hash_equals($token, (string) $request->cookie(MaintenanceMode::BYPASS_COOKIE))) {
                return $next($request);
            }
        }

        [, $endsAt] = MaintenanceMode::window();

        return response()
            ->view('maintenance', [
                'message' => MaintenanceMode::message(),
                'eta' => MaintenanceMode::eta() ?? $endsAt,
            ], 503)
            ->header('Retry-After', (string) MaintenanceMode::retryAfterSeconds());
    }
}
