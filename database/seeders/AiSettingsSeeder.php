<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class AiSettingsSeeder extends Seeder
{
    /**
     * Seed the tenant-level AI kill switch (default ON). Guarded so a
     * reseed never clobbers an admin who has turned AI off from the panel.
     */
    public function run(): void
    {
        if (Setting::query()->where('key', 'ai_enabled')->doesntExist()) {
            Setting::set('ai_enabled', true, 'bool', 'Enable AI assistant & lead analysis', 'ai');
        }
    }
}
