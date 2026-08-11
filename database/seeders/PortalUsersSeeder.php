<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class PortalUsersSeeder extends Seeder
{
    /**
     * Create one login per department portal so each scaffold can be exercised.
     *
     * Reuses ADMIN_SEED_PASSWORD (does nothing if it's not set). Emails default
     * to <dept>@epathways.co.nz and can be overridden with <DEPT>_SEED_EMAIL,
     * e.g. SALES_SEED_EMAIL=sales.lead@epathways.co.nz.
     */
    public function run(): void
    {
        $password = env('ADMIN_SEED_PASSWORD');

        if (! $password) {
            $this->command->warn('ADMIN_SEED_PASSWORD not set — department portal users NOT created.');

            return;
        }

        foreach (User::PORTAL_ROLES as $role) {
            $email = env(strtoupper($role).'_SEED_EMAIL', "{$role}@epathways.co.nz");

            User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => ucfirst($role).' Team',
                    'password' => bcrypt($password),
                    'role' => $role,
                ]
            );
        }

        // Immigration sub-roles (not in PORTAL_ROLES): the manager (full portal)
        // and the adviser (LIA — own portal). The adviser gets a current IAA
        // licence so advice-bearing sign-off is exercisable.
        User::updateOrCreate(
            ['email' => env('IMMIGRATION_MANAGER_SEED_EMAIL', 'immigration.manager@epathways.co.nz')],
            ['name' => 'Immigration Manager', 'password' => bcrypt($password), 'role' => User::ROLE_IMMIGRATION_MANAGER],
        );
        User::updateOrCreate(
            ['email' => env('IMMIGRATION_ADVISER_SEED_EMAIL', 'immigration.adviser@epathways.co.nz')],
            [
                'name' => 'Immigration Adviser',
                'password' => bcrypt($password),
                'role' => User::ROLE_IMMIGRATION_ADVISER,
                'iaa_licence_number' => '202500123',
                'iaa_licence_type' => 'full',
                'iaa_licence_expiry' => now()->addYear()->toDateString(),
                'iaa_licence_verified_at' => now(),
            ],
        );

        $this->command->info('Department portal users seeded ('.implode(', ', User::PORTAL_ROLES).', immigration_manager, immigration_adviser).');
    }
}
