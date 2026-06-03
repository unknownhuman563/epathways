<?php

namespace App\Policies;

use App\Models\User;
use App\Models\VisaType;

class VisaTypePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
            User::ROLE_SUPER_ADMIN,
            User::ROLE_ADMIN,
            User::ROLE_IMMIGRATION_MANAGER,
            User::ROLE_IMMIGRATION_ADVISER,
        ]);
    }

    public function view(User $user, VisaType $visaType): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole([User::ROLE_SUPER_ADMIN, User::ROLE_ADMIN]);
    }

    public function update(User $user, VisaType $visaType): bool
    {
        return $user->hasAnyRole([
            User::ROLE_SUPER_ADMIN,
            User::ROLE_ADMIN,
            User::ROLE_IMMIGRATION_MANAGER,
        ]);
    }

    public function delete(User $user, VisaType $visaType): bool
    {
        return $user->isSuperAdmin();
    }

    public function viewPriceHistory(User $user, VisaType $visaType): bool
    {
        return $this->update($user, $visaType);
    }
}
