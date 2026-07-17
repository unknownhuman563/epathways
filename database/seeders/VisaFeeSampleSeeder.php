<?php

namespace Database\Seeders;

use App\Models\VisaType;
use Illuminate\Database\Seeder;

/**
 * LOCAL SAMPLE ONLY — fills sample "Professional Fees" + "INZ Application
 * Fee" values on visa types that don't have them yet, so the engagement
 * Written Agreement renders real amounts instead of placeholders during
 * local testing. Only touches rows where the fee is null/0, so real data
 * (once entered on the Visas page) is never overwritten.
 *
 * Run: php artisan db:seed --class=VisaFeeSampleSeeder
 */
class VisaFeeSampleSeeder extends Seeder
{
    /**
     * Sample [professional_fees, inz_application_fee] keyed by a lowercase
     * category keyword. Indicative NZD amounts for testing only.
     */
    private const SAMPLES = [
        'student' => [2500, 375],
        'work' => [3500, 750],
        'resident' => [6000, 5510],
        'partner' => [4000, 2470],
        'visitor' => [1500, 246],
        'other' => [3000, 700],
    ];

    private const DEFAULT_SAMPLE = [3000, 700];

    public function run(): void
    {
        $updated = 0;

        foreach (VisaType::all() as $visa) {
            [$prof, $inz] = $this->sampleFor($visa);

            $patch = [];
            if ($visa->professional_fees === null || (float) $visa->professional_fees <= 0) {
                $patch['professional_fees'] = $prof;
            }
            if ($visa->inz_application_fee === null || (float) $visa->inz_application_fee <= 0) {
                $patch['inz_application_fee'] = $inz;
            }

            if ($patch) {
                $visa->forceFill($patch)->save();
                $updated++;
                $this->command?->info("  {$visa->name}: ".json_encode($patch));
            }
        }

        $this->command?->info("VisaFeeSampleSeeder: updated {$updated} visa type(s).");
    }

    private function sampleFor(VisaType $visa): array
    {
        $haystack = strtolower(trim(($visa->category ?? '').' '.$visa->name.' '.($visa->code ?? '')));

        foreach (self::SAMPLES as $keyword => $sample) {
            if (str_contains($haystack, $keyword)) {
                return $sample;
            }
        }

        return self::DEFAULT_SAMPLE;
    }
}
