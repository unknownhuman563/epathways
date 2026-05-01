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
                    $decoded = json_decode((string) $program->employment_outcomes, true);
                    if (! is_array($decoded) || ! (array_key_exists('paragraph', $decoded) || array_key_exists('sections', $decoded))) {
                        continue;
                    }

                    $paragraph = isset($decoded['paragraph']) && is_string($decoded['paragraph']) ? trim($decoded['paragraph']) : '';
                    $sections = is_array($decoded['sections'] ?? null) ? array_values($decoded['sections']) : [];

                    if ($paragraph !== '') {
                        array_unshift($sections, ['intro' => $paragraph, 'bullets' => []]);
                    }

                    DB::table('programs')
                        ->where('id', $program->id)
                        ->update(['employment_outcomes' => json_encode($sections)]);
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
                    if (! is_array($decoded) || empty($decoded)) continue;
                    $first = $decoded[0] ?? null;
                    if (! is_array($first) || ! (array_key_exists('intro', $first) || array_key_exists('bullets', $first))) continue;

                    DB::table('programs')
                        ->where('id', $program->id)
                        ->update(['employment_outcomes' => json_encode([
                            'paragraph' => '',
                            'sections' => array_values($decoded),
                        ])]);
                }
            });
    }
};
