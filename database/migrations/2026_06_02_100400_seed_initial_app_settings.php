<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        DB::table('app_settings')->insertOrIgnore([
            [
                'key'        => 'resident_intake_fee_cents',
                'value'      => '25000',
                'type'       => 'int',
                'label'      => 'Resident-visa consultation fee (NZD cents)',
                'group'      => 'payments',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key'        => 'resident_intake_fee_currency',
                'value'      => 'NZD',
                'type'       => 'string',
                'label'      => 'Resident-visa consultation fee currency',
                'group'      => 'payments',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        DB::table('app_settings')
            ->whereIn('key', ['resident_intake_fee_cents', 'resident_intake_fee_currency'])
            ->delete();
    }
};
