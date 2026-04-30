<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('programs')
            ->whereNotNull('employment_outcomes')
            ->where('employment_outcomes', '!=', '')
            ->orderBy('id')
            ->chunkById(100, function ($programs) {
                foreach ($programs as $program) {
                    $current = $program->employment_outcomes;
                    if (str_starts_with(trim((string) $current), '[')) {
                        continue;
                    }
                    DB::table('programs')
                        ->where('id', $program->id)
                        ->update(['employment_outcomes' => json_encode([$current])]);
                }
            });
    }

    public function down(): void
    {
        DB::table('programs')
            ->whereNotNull('employment_outcomes')
            ->where('employment_outcomes', '!=', '')
            ->orderBy('id')
            ->chunkById(100, function ($programs) {
                foreach ($programs as $program) {
                    $decoded = json_decode($program->employment_outcomes, true);
                    if (is_array($decoded)) {
                        DB::table('programs')
                            ->where('id', $program->id)
                            ->update(['employment_outcomes' => $decoded[0] ?? null]);
                    }
                }
            });
    }
};
