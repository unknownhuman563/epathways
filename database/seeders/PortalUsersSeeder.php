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

        $this->command->info('Department portal users seeded ('.implode(', ', User::PORTAL_ROLES).').');
    }
}
