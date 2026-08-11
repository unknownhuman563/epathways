<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call(AdminSeeder::class);
        $this->call(SuperAdminSeeder::class);
        $this->call(PortalUsersSeeder::class);
        $this->call(ProgramSeeder::class);
        $this->call(PropertySeeder::class);
        $this->call(DefaultMessageTemplatesSeeder::class);
        $this->call(AiSettingsSeeder::class);
        // Build 12 phase 4.5 — the 16-step immigration process (idempotent).
        $this->call(CaseStepTemplateSeeder::class);
        // Official INZ forms (real PDFs + overlay maps) — installed everywhere.
        $this->call(OfficialInzFormsSeeder::class);
    }
}
