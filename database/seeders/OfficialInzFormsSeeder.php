<?php

namespace Database\Seeders;

use App\Models\InzForm;
use App\Models\InzFormVersion;
use App\Models\User;
use App\Models\VisaCategory;
use App\Services\Immigration\InzFieldExtractor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * Installs the OFFICIAL INZ forms into the catalogue so they exist identically
 * in every environment (local / staging / prod). The real government PDFs live
 * in database/seeders/assets/inz/ (git-tracked); this copies them into storage
 * and records a current version per form with an overlay field_map.
 *
 * Overlay = the official page is used as the background and case data is stamped
 * at each field's real coordinates (read from the PDF's own AcroForm geometry).
 * This is required because modern INZ PDFs are linearized / object-stream Adobe
 * forms that pure-PHP AcroForm fillers (FPDM) cannot populate.
 *
 * Idempotent — safe to re-run. Run on deploy or via:
 *   php artisan db:seed --class=OfficialInzFormsSeeder
 */
class OfficialInzFormsSeeder extends Seeder
{
    /**
     * code => [name, category, effective, map(source => Adobe field name)]
     * Field names come from each PDF's AcroForm (Adobe auto-names them
     * generically); positions are resolved from the PDF, so the map is just
     * "which case value goes in which field".
     */
    private const FORMS = [
        'INZ1014' => [
            'name' => 'Financial Undertaking for a Student',
            'category' => 'Student',
            'effective' => '2025-06-01',
            'map' => [
                'applicant.family_name' => 'Text Field 2',   // A1 Family/last name (student)
                'applicant.first_name' => 'Text Field 3',    // A1 Given/first name(s)
            ],
        ],
        'INZ1025' => [
            'name' => 'Sponsorship Form for Temporary Entry',
            'category' => 'Student',
            'effective' => '2025-09-01',
            'map' => [
                'applicant.full_name' => '001',              // A1 Applicant 1 full name
            ],
        ],
        // INZ1226 uses a compressed PDF the free overlay engine can't import yet;
        // seeded so it's catalogued, but with no map (Generate reports cleanly).
        'INZ1226' => [
            'name' => 'Student Visa Declaration',
            'category' => 'Student',
            'effective' => '2026-08-01',
            'map' => [],
        ],
    ];

    public function run(): void
    {
        $adviser = User::whereNotNull('iaa_licence_number')->first()
            ?? User::where('role', 'immigration')->first()
            ?? User::where('role', 'admin')->first()
            ?? User::first();

        $extractor = app(InzFieldExtractor::class);

        foreach (self::FORMS as $code => $cfg) {
            VisaCategory::firstOrCreate(['name' => $cfg['category']], ['description' => $cfg['category'].' visa pathway']);

            $form = InzForm::updateOrCreate(
                ['code' => $code],
                ['name' => $cfg['name'], 'category' => $cfg['category'], 'is_active' => true],
            );

            $asset = database_path("seeders/assets/inz/{$code}.pdf");
            if (! is_file($asset)) {
                $this->command?->warn("Skipping {$code}: official PDF not found at {$asset}");

                continue;
            }

            // Copy the official PDF into storage (where the filler reads it).
            $dest = "inz-forms/official/{$code}.pdf";
            Storage::disk('local')->put($dest, file_get_contents($asset));

            // Resolve the overlay coordinate map from the PDF's field geometry.
            $map = [];
            if ($cfg['map'] && $extractor->supported()) {
                $map = $extractor->buildOverlayMap($asset, $cfg['map']);
                $missing = count($cfg['map']) - count($map);
                if ($missing > 0) {
                    $this->command?->warn("{$code}: {$missing} mapped field(s) not found in the PDF.");
                }
            }

            // One canonical current version per form.
            InzFormVersion::where('inz_form_id', $form->id)->update(['is_current' => false]);
            InzFormVersion::updateOrCreate(
                ['inz_form_id' => $form->id, 'version_label' => 'Official — Aug 2026'],
                [
                    'file_path' => $dest,
                    'is_acroform' => true,
                    'field_map' => $map,
                    'effective_from' => Carbon::parse($cfg['effective']),
                    'is_current' => true,
                    'checked_at' => now(),
                    'uploaded_by' => $adviser?->id,
                ],
            );

            $this->command?->info("{$code}: installed ({$dest}), ".count($map).' field(s) mapped.');
        }
    }
}
