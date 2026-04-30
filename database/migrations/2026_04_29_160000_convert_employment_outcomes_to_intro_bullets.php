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

                    if (is_array($decoded) && (array_key_exists('intro', $decoded) || array_key_exists('bullets', $decoded))) {
                        continue;
                    }

                    if (is_array($decoded)) {
                        $items = array_values(array_filter($decoded, fn ($v) => is_string($v) && trim($v) !== ''));
                        if (count($items) === 1) {
                            $new = ['intro' => $items[0], 'bullets' => []];
                        } else {
                            $new = ['intro' => '', 'bullets' => $items];
                        }
                    } else {
                        $new = ['intro' => (string) $current, 'bullets' => []];
                    }

                    DB::table('programs')
                        ->where('id', $program->id)
                        ->update(['employment_outcomes' => json_encode($new)]);
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
                    if (! is_array($decoded) || ! (array_key_exists('intro', $decoded) || array_key_exists('bullets', $decoded))) {
                        continue;
                    }
                    $items = [];
                    if (!empty($decoded['intro'])) $items[] = $decoded['intro'];
                    if (!empty($decoded['bullets']) && is_array($decoded['bullets'])) {
                        $items = array_merge($items, $decoded['bullets']);
                    }
                    DB::table('programs')
                        ->where('id', $program->id)
                        ->update(['employment_outcomes' => json_encode($items)]);
                }
            });
    }
};
