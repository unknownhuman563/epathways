<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    /**
     * Create the top-of-house super-admin login (lands on /admin/super-dashboard).
     *
     * Mirrors AdminSeeder: credentials come from env so they never live in the
     * repo. Email defaults to superadmin@epathways.co.nz; password falls back to
     * ADMIN_SEED_PASSWORD so a single secret can seed both admin and super-admin.
     */
    public function run(): void
    {
        $password = env('SUPER_ADMIN_SEED_PASSWORD', env('ADMIN_SEED_PASSWORD'));

        if (! $password) {
            $this->command->error('SUPER_ADMIN_SEED_PASSWORD (or ADMIN_SEED_PASSWORD) is not set in .env — super-admin user NOT created.');

            return;
        }

        User::updateOrCreate(
            ['email' => env('SUPER_ADMIN_SEED_EMAIL', 'superadmin@epathways.co.nz')],
            [
                'name' => 'Super Admin',
                'password' => bcrypt($password),
                'role' => User::ROLE_SUPER_ADMIN,
            ]
        );

        $this->command->info('Super-admin user seeded.');
    }
}
