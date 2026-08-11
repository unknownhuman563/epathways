<?php

namespace Database\Seeders;

use App\Models\CaseFormAssignment;
use App\Models\InzForm;
use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\User;
use App\Models\VisaCategory;
use App\Models\VisaType;
use App\Services\Immigration\InzCaseContext;
use App\Services\Immigration\InzFormFiller;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

/**
 * LOCAL demo data for the INZ Forms feature, end to end, on the REAL official
 * forms. Installs the official catalogue (OfficialInzFormsSeeder), then adds a
 * few immigration cases with full personal data and INZ1014 assignments in each
 * state (sent to client / client submitted), and generates one real filled
 * official draft so the register shows a "Generated · View" row out of the box.
 *
 * Run with:  php artisan db:seed --class=InzFormsDemoSeeder
 */
class InzFormsDemoSeeder extends Seeder
{
    public function run(): void
    {
        // Real official forms first (INZ1014 / INZ1025 / INZ1226 + PDFs + maps).
        $this->call(OfficialInzFormsSeeder::class);

        $adviser = $this->demoAdviser();
        $category = VisaCategory::firstOrCreate(['name' => 'Student'], ['description' => 'Student visa pathway']);

        VisaType::updateOrCreate(
            ['name' => 'Student Visa'],
            ['code' => 'STUDENT', 'category' => $category->name, 'professional_fees' => 1500, 'inz_application_fee' => 375, 'active' => true],
        );

        $form = InzForm::where('code', 'INZ1014')->first();
        $version = $form?->currentVersion();
        $filler = app(InzFormFiller::class);

        // --- Demo immigration cases --------------------------------------
        $cases = [
            [
                'lead_id' => 'CASE-DEMO-01', 'first_name' => 'Minh An', 'middle_name' => 'Thi', 'last_name' => 'Nguyen',
                'dob' => '2001-03-14', 'gender' => 'Female', 'email' => 'minh.an@example.com', 'phone' => '+64 21 555 0199',
                'citizenship' => 'Vietnam', 'residence_country' => 'Vietnam', 'passport_number' => 'C1234567', 'passport_expiry' => '2030-09-20',
                'assignment' => 'submitted',
            ],
            [
                'lead_id' => 'CASE-DEMO-02', 'first_name' => 'Rahul', 'middle_name' => null, 'last_name' => 'Sharma',
                'dob' => '1999-07-02', 'gender' => 'Male', 'email' => 'rahul.sharma@example.com', 'phone' => '+64 22 555 0142',
                'citizenship' => 'India', 'residence_country' => 'India', 'passport_number' => 'M7654321', 'passport_expiry' => '2029-01-15',
                'assignment' => 'assigned',
            ],
            [
                'lead_id' => 'CASE-DEMO-03', 'first_name' => 'Sofia', 'middle_name' => 'Elena', 'last_name' => 'Ramirez',
                'dob' => '2003-11-28', 'gender' => 'Female', 'email' => 'sofia.ramirez@example.com', 'phone' => '+64 27 555 0177',
                'citizenship' => 'Philippines', 'residence_country' => 'Philippines', 'passport_number' => 'P9988776', 'passport_expiry' => '2031-05-10',
                'assignment' => null,
            ],
        ];

        foreach ($cases as $c) {
            $assignmentState = $c['assignment'];
            unset($c['assignment']);

            $lead = Lead::updateOrCreate(
                ['lead_id' => $c['lead_id']],
                array_merge($c, [
                    'is_immigration_case' => true,
                    'immigration_stage' => 'Visa Process',
                    'inz_visa_type' => 'Student Visa',
                    'has_passport' => true,
                    'current_owner_id' => $adviser?->id,
                    'source' => 'demo',
                ]),
            );

            if ($assignmentState && $form && $version) {
                $values = $filler->fieldValues($version, InzCaseContext::for($lead));
                if ($assignmentState === 'submitted') {
                    // Simulate the client correcting their given names.
                    $values['Text Field 3'] = 'Minh An Thi';
                }

                CaseFormAssignment::updateOrCreate(
                    ['lead_id' => $lead->id, 'inz_form_id' => $form->id],
                    [
                        'inz_form_version_id' => $version->id,
                        'status' => $assignmentState,
                        'field_values' => $values,
                        'assigned_by' => $adviser?->id,
                        'submitted_at' => $assignmentState === 'submitted' ? now()->subDay() : null,
                    ],
                );
            }
        }

        // Generate one real filled official draft (from the submitted answers) so
        // the register shows a "Generated · View" row at the top out of the box.
        $submitted = Lead::where('lead_id', 'CASE-DEMO-01')->first();
        if ($submitted && $form && $version) {
            $assign = CaseFormAssignment::where('lead_id', $submitted->id)->where('inz_form_id', $form->id)->first();
            try {
                $bytes = $filler->fillWithValues($version, $assign?->field_values ?? []);
                $path = "inz-generated/{$submitted->id}/demo-inz1014.pdf";
                Storage::disk('local')->put($path, $bytes);

                LeadDocument::updateOrCreate(
                    ['lead_id' => $submitted->id, 'source_variant' => 'inz:INZ1014'],
                    [
                        'original_name' => "INZ1014 - {$form->name}.pdf",
                        'file_path' => $path,
                        'mime' => 'application/pdf',
                        'size' => strlen($bytes),
                        'source' => 'generated',
                        'inz_form_version_id' => $version->id,
                        'status' => 'StaffShared',
                        'uploaded_by' => $adviser?->id,
                        'note' => 'Draft — official INZ1014 filled from the case. Review before filing (step 10).',
                    ],
                );
                if ($assign) {
                    $assign->forceFill(['status' => 'reviewed', 'reviewed_by' => $adviser?->id, 'reviewed_at' => now()])->save();
                }
            } catch (\Throwable $e) {
                $this->command?->warn('Demo draft generation skipped: '.$e->getMessage());
            }
        }

        $this->command?->info('INZ Forms demo seeded: 3 cases, INZ1014 assignments (submitted + sent), 1 generated official draft.');
    }

    /** Reuse an LIA/immigration/admin user as the demo adviser, else any user. */
    private function demoAdviser(): ?User
    {
        return User::whereNotNull('iaa_licence_number')->first()
            ?? User::where('role', 'immigration')->first()
            ?? User::where('role', 'admin')->first()
            ?? User::first();
    }
}
