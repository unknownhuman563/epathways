<?php

namespace App\Http\Middleware;

use App\Models\Lead;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Row-level scoping for the lead-profile routes mirrored under the recruiting
 * portals (/portal/agent/leads/*, /portal/sub-agent/leads/*).
 *
 * Those portals reuse the full sales lead profile, which means they reuse its
 * ~30 write endpoints. `portal:agent` only proves the caller holds the role —
 * it says nothing about WHICH lead they may touch, so on its own an agent could
 * edit, convert or delete any lead in the system by guessing an id. This
 * middleware supplies the missing predicate, once, in front of the whole group
 * rather than relying on ~30 controller methods to each remember the check.
 *
 * See CLAUDE.md: "EnsurePortalAccess is role-level only — it does not scope
 * rows. Controllers must re-check ownership themselves."
 *
 * A role with no recruiting scope (admin, sales, education …) passes straight
 * through; this middleware is only mounted on the recruiting-portal groups, and
 * failing open for them would silently widen access rather than narrow it — so
 * an unrecognised role is refused instead.
 */
class EnsureLeadInPortalScope
{
    /** Route parameters the lead id can arrive under across these routes. */
    private const ID_PARAMS = ['id', 'leadId', 'lead'];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        abort_unless($user, 403);

        $leadId = null;
        foreach (self::ID_PARAMS as $param) {
            $value = $request->route($param);
            if ($value !== null) {
                // Route-model binding can hand back a Lead rather than an id.
                $leadId = $value instanceof Lead ? $value->id : $value;
                break;
            }
        }

        // No lead in the URL (a collection route) — nothing to scope here.
        if ($leadId === null) {
            return $next($request);
        }

        $ownerId = match ($user->role) {
            'agent' => $user->id,
            'sub_agent' => $user->parent_agent_id,
            default => null,
        };

        // A sub-agent with no parent agent has no referrals to work on, and any
        // other role has no business on a recruiting-portal URL.
        abort_if($ownerId === null, 404);

        abort_unless(
            Lead::where('id', $leadId)->where('agent_id', $ownerId)->exists(),
            404
        );

        return $next($request);
    }
}
