<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePortalAccess
{
    /**
     * The single role gate for the whole app. The request passes only if the
     * authenticated user holds one of the given roles — pass any mix of 'admin'
     * or a department portal ('sales', 'education', 'english', 'immigration',
     * 'accommodation'). Admins satisfy every check.
     *
     * Usage in routes:
     *   ->middleware('portal:admin')              // the /admin area
     *   ->middleware('portal:sales')              // a single department portal
     *   ->middleware('portal:admin,immigration')  // admin OR immigration staff
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        $allowed = $user && collect($roles)->contains(
            fn (string $role): bool => $user->canAccessPortal($role)
        );

        abort_unless($allowed, 403, 'You do not have access to this area.');

        return $next($request);
    }
}
