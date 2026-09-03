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
                // Grantable sub-parts. Granting the whole module implies them all.
                'features' => collect($cfg['features'] ?? [])
                    ->map(fn ($f, $fk) => [
                        'key' => "{$key}.{$fk}",
                        'label' => $f['label'] ?? ucfirst($fk),
                        'description' => $f['description'] ?? '',
                    ])->values()->all(),
            ])
            ->values()
            ->all();

        // Every valid grantable key (parents + dotted features).
        $validKeys = $this->validKeys();

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
                // Super admins implicitly hold every module + feature.
                'is_super_admin' => $u->isSuperAdmin(),
                'modules' => $u->isSuperAdmin()
                    ? $validKeys
                    : array_values(array_intersect((array) ($u->module_permissions ?? []), $validKeys)),
            ])
            ->values();

        return inertia('admin/ModuleManagement', [
            'modules' => $modules,
            'users' => $users,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validKeys = $this->validKeys();

        $data = $request->validate([
            'modules' => ['array'],
            'modules.*' => [Rule::in($validKeys)],
        ]);

        // Super admins already see everything — nothing to store for them.
        if ($user->isSuperAdmin()) {
            return back()->with('error', 'Super admins already have every module.');
        }

        // Keep valid, de-duped keys; drop a redundant feature key when its whole
        // parent module is granted (the grant already implies every feature).
        $granted = array_values(array_unique(array_intersect($data['modules'] ?? [], $validKeys)));
        $granted = array_values(array_filter($granted, function ($k) use ($granted) {
            if (! str_contains($k, '.')) {
                return true;
            }

            return ! in_array(explode('.', $k, 2)[0], $granted, true);
        }));

        $user->update(['module_permissions' => $granted]);

        return back()->with('success', "Module access updated for {$user->name}.");
    }

    /** Every grantable key: each restricted module plus its dotted feature keys. */
    private function validKeys(): array
    {
        $keys = [];
        foreach (config('modules.restricted', []) as $key => $cfg) {
            $keys[] = $key;
            foreach (array_keys($cfg['features'] ?? []) as $fk) {
                $keys[] = "{$key}.{$fk}";
            }
        }

        return $keys;
    }
}
