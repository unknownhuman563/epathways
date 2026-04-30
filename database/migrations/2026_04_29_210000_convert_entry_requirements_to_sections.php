<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('programs')
            ->whereNotNull('entry_requirements')
            ->where('entry_requirements', '!=', '')
            ->orderBy('id')
            ->chunkById(100, function ($programs) {
                foreach ($programs as $program) {
                    $current = $program->entry_requirements;
                    $decoded = json_decode((string) $current, true);

                    if (is_array($decoded) && ! empty($decoded)) {
                        $first = $decoded[0] ?? null;
                        if (is_array($first) && (array_key_exists('intro', $first) || array_key_exists('bullets', $first))) {
                            continue;
                        }
                    }

                    $sections = [['intro' => (string) $current, 'bullets' => []]];

                    DB::table('programs')
                        ->where('id', $program->id)
                        ->update(['entry_requirements' => json_encode($sections)]);
                }
            });
    }

    public function down(): void
    {
        DB::table('programs')
            ->whereNotNull('entry_requirements')
            ->where('entry_requirements', '!=', '')
            ->orderBy('id')
            ->chunkById(100, function ($programs) {
                foreach ($programs as $program) {
                    $decoded = json_decode((string) $program->entry_requirements, true);
                    if (! is_array($decoded) || empty($decoded)) continue;
                    $first = $decoded[0] ?? null;
                    if (! is_array($first) || ! (array_key_exists('intro', $first) || array_key_exists('bullets', $first))) continue;

                    $intro = (string) ($first['intro'] ?? '');
                    DB::table('programs')
                        ->where('id', $program->id)
                        ->update(['entry_requirements' => $intro]);
                }
            });
    }
};
