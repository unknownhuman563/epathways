<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Module Management — super-admin-only surface for granting per-user access to
 * RESTRICTED modules (config/modules.php `restricted`). Every other module is
 * grandfathered and stays visible by role; only the modules listed here are
 * hidden by default and toggled on per user.
 *
 * Access is gated by `portal:super_admin` on the routes.
 */
class ModuleManagementController extends Controller
{
    public function index(Request $request)
    {
        $restricted = config('modules.restricted', []);

        $modules = collect($restricted)
            ->map(fn ($cfg, $key) => [
                'key' => $key,
                'label' => $cfg['label'] ?? ucfirst($key),
                'description' => $cfg['description'] ?? '',
            ])
            ->values()
            ->all();

        // Staff accounts only — leads/clients don't have a module sidebar to gate.
        $users = User::query()
            ->whereNotIn('role', [User::ROLE_LEAD, User::ROLE_REVOKED_LEAD])
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'module_permissions'])
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
                // Super admins implicitly hold every restricted module.
                'is_super_admin' => $u->isSuperAdmin(),
                'modules' => $u->isSuperAdmin()
                    ? array_keys($restricted)
                    : array_values(array_intersect((array) ($u->module_permissions ?? []), array_keys($restricted))),
            ])
            ->values();

        return inertia('admin/ModuleManagement', [
            'modules' => $modules,
            'users' => $users,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $restricted = array_keys(config('modules.restricted', []));

        $data = $request->validate([
            'modules' => ['array'],
            'modules.*' => [Rule::in($restricted)],
        ]);

        // Super admins already see everything — nothing to store for them.
        if ($user->isSuperAdmin()) {
            return back()->with('error', 'Super admins already have every module.');
        }

        // Keep only valid, de-duped restricted keys.
        $granted = array_values(array_unique(array_intersect($data['modules'] ?? [], $restricted)));

        $user->update(['module_permissions' => $granted]);

        return back()->with('success', "Module access updated for {$user->name}.");
    }
}
