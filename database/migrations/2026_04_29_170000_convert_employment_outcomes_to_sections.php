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
                    $decoded = json_decode((string) $current, true);

                    $sections = null;

                    if (is_array($decoded)) {
                        $first = $decoded[0] ?? null;
                        if (is_array($first) && (array_key_exists('intro', $first) || array_key_exists('bullets', $first))) {
                            continue;
                        } elseif (array_key_exists('intro', $decoded) || array_key_exists('bullets', $decoded)) {
                            $sections = [[
                                'intro' => $decoded['intro'] ?? '',
                                'bullets' => is_array($decoded['bullets'] ?? null) ? $decoded['bullets'] : [],
                            ]];
                        } else {
                            $items = array_values(array_filter($decoded, fn ($v) => is_string($v) && trim($v) !== ''));
                            if (count($items) === 1) {
                                $sections = [['intro' => $items[0], 'bullets' => []]];
                            } elseif (count($items) > 1) {
                                $sections = [['intro' => '', 'bullets' => $items]];
                            }
                        }
                    } else {
                        $sections = [['intro' => (string) $current, 'bullets' => []]];
                    }

                    if ($sections !== null) {
                        DB::table('programs')
                            ->where('id', $program->id)
                            ->update(['employment_outcomes' => json_encode($sections)]);
                    }
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
                    $decoded = json_decode((string) $program->employment_outcomes, true);
                    if (! is_array($decoded) || empty($decoded)) {
                        continue;
                    }
                    $first = $decoded[0] ?? null;
                    if (! is_array($first) || ! (array_key_exists('intro', $first) || array_key_exists('bullets', $first))) {
                        continue;
                    }
                    DB::table('programs')
                        ->where('id', $program->id)
                        ->update(['employment_outcomes' => json_encode($first)]);
                }
            });
    }
};
