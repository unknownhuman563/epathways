<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $password = env('ADMIN_SEED_PASSWORD');

        if (!$password) {
            $this->command->error('ADMIN_SEED_PASSWORD is not set in .env — admin user NOT created.');
            return;
        }

        User::updateOrCreate(
            ['email' => env('ADMIN_SEED_EMAIL', 'admin@epathways.co.nz')],
            [
                'name' => 'Admin',
                'password' => bcrypt($password),
            ]
        );

        $this->command->info('Admin user seeded.');
    }
}
