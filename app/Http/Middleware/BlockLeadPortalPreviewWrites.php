<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * The client portal can be previewed by staff (admins browsing /portal/lead
 * without a lead of their own). That preview is strictly READ-ONLY — a staffer
 * must never mutate a real client's data through it. Any non-GET request from a
 * previewing staffer is blocked; genuine lead users are unaffected.
 */
class BlockLeadPortalPreviewWrites
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        $isStaffPreview = $user
            && ! $user->lead
            && method_exists($user, 'isAtLeast')
            && $user->isAtLeast('admin');

        if ($isStaffPreview && ! $request->isMethodSafe()) {
            // Don't hard-403 (that renders the scary "Access Denied" page) — send
            // the staffer back with a clear note that the preview can't be edited.
            return back()->with('error', 'This is a read-only preview of the client portal — switch to the client to make changes.');
        }

        return $next($request);
    }
}
