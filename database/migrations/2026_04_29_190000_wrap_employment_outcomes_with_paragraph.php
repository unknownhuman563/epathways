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
                    $new = $this->normalizeValue($decoded, $program->employment_outcomes);
                    if ($new === null) continue;
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
                    if (! is_array($decoded) || ! (array_key_exists('paragraph', $decoded) || array_key_exists('sections', $decoded))) {
                        continue;
                    }
                    $sections = is_array($decoded['sections'] ?? null) ? $decoded['sections'] : [];
                    if (!empty($decoded['paragraph'])) {
                        array_unshift($sections, ['intro' => $decoded['paragraph'], 'bullets' => []]);
                    }
                    DB::table('programs')
                        ->where('id', $program->id)
                        ->update(['employment_outcomes' => json_encode($sections)]);
                }
            });
    }

    private function normalizeValue($decoded, $raw)
    {
        if (is_array($decoded)) {
            if (array_key_exists('paragraph', $decoded) || array_key_exists('sections', $decoded)) {
                return null;
            }
            $first = $decoded[0] ?? null;
            if (is_array($first) && (array_key_exists('intro', $first) || array_key_exists('bullets', $first))) {
                return ['paragraph' => '', 'sections' => array_values($decoded)];
            }
            if (array_key_exists('intro', $decoded) || array_key_exists('bullets', $decoded)) {
                return ['paragraph' => '', 'sections' => [$decoded]];
            }
            $items = array_values(array_filter($decoded, fn ($v) => is_string($v) && trim($v) !== ''));
            if (count($items) === 1) return ['paragraph' => $items[0], 'sections' => []];
            if (count($items) > 1) return ['paragraph' => '', 'sections' => [['intro' => '', 'bullets' => $items]]];
            return null;
        }
        if (is_string($raw) && trim($raw) !== '') {
            return ['paragraph' => $raw, 'sections' => []];
        }
        return null;
    }
};
