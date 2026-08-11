<?php

namespace App\Policies;

use App\Models\User;

/**
 * Content-level control for advice-bearing artifacts (Build 12 §2).
 *
 * The Immigration Advisers Licensing Act 2007 restricts *who may give
 * immigration advice* — only a Licensed Immigration Adviser lawfully may. So
 * the gate is the LICENCE, not the role, and not a controller check:
 *
 *   - Eligibility endorsement and its reasoning
 *   - Case verdict (good_to_go / needs_something / cannot_endorse)
 *   - RFI responses to INZ
 *   - Lodgement sign-off
 *   - Written advice issued under the engagement
 *   - Any client-facing statement about whether the applicant qualifies
 *
 * must be authored or approved by someone holding a *current* licence.
 *
 * This replaces the old role-level rule (immigration_adviser read-only), which
 * pushed advice-bearing content onto unlicensed staff and left the adviser
 * merely nodding at it verbally. Do not reinstate a role check here — a lapsed
 * licence must close the gate on its own, and a manager/admin role must not
 * substitute for a licence.
 *
 * AI-sourced content may populate a *draft* of any advice-bearing artifact but
 * must never be recorded as its approver. That is enforced structurally: an AI
 * / system actor never holds a licence, so approve() returns false for it —
 * enforce the approver via this policy, never bypass it in a controller.
 *
 * Registered as the `approve-advice-bearing` Gate in AppServiceProvider and,
 * as the advice-bearing models land (CaseVerdict, RFI response, lodgement
 * sign-off), mapped to those models so `authorize('approve', $model)` resolves
 * here.
 */
class AdviceBearingPolicy
{
    /**
     * May this user author or approve advice-bearing content?
     *
     * $model is optional so the ability works both as a class-level Gate
     * (`Gate::allows('approve-advice-bearing')`, UI affordances) and as a
     * per-instance policy check (`authorize('approve', $verdict)`).
     */
    public function approve(User $user, $model = null): bool
    {
        return $user->holdsCurrentLicence();
    }
}
