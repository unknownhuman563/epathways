<?php

namespace App\Support;

use App\Models\Lead;
use App\Models\User;

/**
 * Department-scoped lead visibility — the single security boundary for the
 * communications tooling. Mirrors the Build 9/10 AI analysis gate so a sales
 * user can never reach an immigration case (or vice versa):
 *
 *   - admin / super-admin → every lead
 *   - sales              → leads still in the pipeline (no conversion flags)
 *   - education          → is_student
 *   - english            → is_english_student
 *   - immigration (+ manager/adviser) → is_immigration_case
 *   - accommodation      → is_accommodation_client
 *   - anyone else (e.g. lead role) → nothing
 */
class LeadAccess
{
    public static function canView(User $user, Lead $lead): bool
    {
        if (in_array($user->role, [User::ROLE_ADMIN, User::ROLE_SUPER_ADMIN], true)) {
            return true;
        }

        return match ($user->role) {
            'sales' => ! $lead->is_student
                && ! $lead->is_immigration_case
                && ! $lead->is_english_student
                && ! $lead->is_accommodation_client,
            'education'     => (bool) $lead->is_student,
            'english'       => (bool) $lead->is_english_student,
            'immigration', User::ROLE_IMMIGRATION_MANAGER, User::ROLE_IMMIGRATION_ADVISER => (bool) $lead->is_immigration_case,
            'accommodation' => (bool) $lead->is_accommodation_client,
            default         => false,
        };
    }
}
