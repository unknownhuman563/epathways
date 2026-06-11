<?php

namespace App\Policies;

use App\Models\User;
use App\Models\VisaType;

class VisaTypePolicy
{
    public function viewAny(User $user): bool
    {
        // The singleton "immigration" portal role (per User::PORTAL_ROLES)
        // is what actual immigration-team users have. The Manager / Adviser
        // tiers were planned but the project ships with the flat
        // department role today, so we have to whitelist plain
        // `immigration` here or every adviser hits a 403.
        return $user->hasAnyRole([
            User::ROLE_SUPER_ADMIN,
            User::ROLE_ADMIN,
            User::ROLE_IMMIGRATION_MANAGER,
            User::ROLE_IMMIGRATION_ADVISER,
            'immigration',
        ]);
    }

    public function view(User $user, ?VisaType $visaType = null): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        // Department staff can spin up new visa types — they're the ones
        // adding INZ products to the catalogue. Admin tiers retain access
        // for completeness.
        return $user->hasAnyRole([
            User::ROLE_SUPER_ADMIN,
            User::ROLE_ADMIN,
            User::ROLE_IMMIGRATION_MANAGER,
            'immigration',
        ]);
    }

    /*
     * NB: $visaType is nullable on these three because the controller's
     * index() calls `$user->can('update', VisaType::class)` to drive the
     * UI affordances — Laravel resolves that with the class string and so
     * calls the policy with the user only. If we required an instance the
     * call would die with ArgumentCountError. Keeping the param optional
     * lets both `can('update', VisaType::class)` (UI gating) and
     * `can('update', $visaType)` (per-row guard) coexist.
     */
    public function update(User $user, ?VisaType $visaType = null): bool
    {
        return $user->hasAnyRole([
            User::ROLE_SUPER_ADMIN,
            User::ROLE_ADMIN,
            User::ROLE_IMMIGRATION_MANAGER,
            'immigration',
        ]);
    }

    public function delete(User $user, ?VisaType $visaType = null): bool
    {
        // Soft-delete is a maintenance action — manager-tier + admins
        // only. Plain `immigration` advisers stay locked out.
        return $user->hasAnyRole([
            User::ROLE_SUPER_ADMIN,
            User::ROLE_ADMIN,
            User::ROLE_IMMIGRATION_MANAGER,
        ]);
    }

    public function viewPriceHistory(User $user, ?VisaType $visaType = null): bool
    {
        return $this->update($user, $visaType);
    }
}
