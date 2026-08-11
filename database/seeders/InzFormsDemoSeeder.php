<?php

namespace Database\Seeders;

use App\Models\CaseFormAssignment;
use App\Models\InzForm;
use App\Models\InzFormVersion;
use App\Models\Lead;
use App\Models\User;
use App\Models\VisaCategory;
use App\Models\VisaType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * LOCAL-ONLY demo data for the INZ Forms feature end to end: a Student category
 * + visa type, a couple of catalogue forms, a REAL fillable sample PDF wired to
 * one form's current version (so Generate actually produces a filled draft), a
 * few immigration cases with full personal data, and assignments in each state
 * (sent to client / client submitted).
 *
 * The sample PDF is a labelled stand-in, NOT an official INZ form — its version
 * label says so. Run with:  php artisan db:seed --class=InzFormsDemoSeeder
 */
class InzFormsDemoSeeder extends Seeder
{
    public function run(): void
    {
        $adviser = $this->demoAdviser();
        $category = VisaCategory::firstOrCreate(['name' => 'Student'], ['code' => 'STU', 'description' => 'Student visa pathway']);

        VisaType::updateOrCreate(
            ['name' => 'Student Visa'],
            ['code' => 'STUDENT', 'category' => $category->name, 'professional_fees' => 1500, 'inz_application_fee' => 375, 'active' => true],
        );

        // Two catalogue forms. INZ1012 gets a real sample PDF (ready to fill);
        // INZ1014 is left without a PDF to demonstrate the "No PDF yet" state.
        $form1012 = InzForm::updateOrCreate(
            ['code' => 'INZ1012'],
            ['name' => 'Student Visa Application', 'category' => $category->name, 'is_active' => true],
        );
        $form1014 = InzForm::updateOrCreate(
            ['code' => 'INZ1014'],
            ['name' => 'Additional Applicant / Supporting Information', 'category' => $category->name, 'is_active' => true],
        );

        // --- Real fillable sample PDF for INZ1012 -------------------------
        $pdfPath = 'inz-forms/demo/inz1012-sample.pdf';
        Storage::disk('local')->put($pdfPath, $this->buildDemoAcroform());

        // pdf field name => InzCaseContext source key (this IS the field_map).
        $fieldMap = [
            ['pdf_field' => 'family_name',     'source' => 'applicant.family_name'],
            ['pdf_field' => 'given_names',     'source' => 'applicant.first_name'],
            ['pdf_field' => 'date_of_birth',   'source' => 'applicant.dob'],
            ['pdf_field' => 'nationality',     'source' => 'applicant.nationality'],
            ['pdf_field' => 'passport_number', 'source' => 'applicant.passport_number'],
            ['pdf_field' => 'passport_expiry', 'source' => 'applicant.passport_expiry'],
            ['pdf_field' => 'email',           'source' => 'applicant.email'],
            ['pdf_field' => 'phone',           'source' => 'applicant.phone'],
        ];

        // One current version, ready + mapped.
        InzFormVersion::where('inz_form_id', $form1012->id)->update(['is_current' => false]);
        InzFormVersion::updateOrCreate(
            ['inz_form_id' => $form1012->id, 'version_label' => 'DEMO (local sample — not official)'],
            [
                'file_path' => $pdfPath,
                'is_acroform' => true,
                'field_map' => $fieldMap,
                'effective_from' => Carbon::parse('2026-01-01'),
                'is_current' => true,
                'checked_at' => now(),
                'uploaded_by' => $adviser?->id,
            ],
        );

        // INZ1014 — a current version but NO file (shows "No PDF yet").
        InzFormVersion::updateOrCreate(
            ['inz_form_id' => $form1014->id, 'version_label' => 'v2024-11'],
            ['is_current' => true, 'effective_from' => Carbon::parse('2024-11-01'), 'uploaded_by' => $adviser?->id],
        );

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

            if ($assignmentState) {
                $version = $form1012->currentVersion();
                // Prefill from the case; for the "submitted" case, simulate the
                // client having corrected a couple of fields.
                $values = [];
                foreach ($fieldMap as $m) {
                    $ctx = \App\Services\Immigration\InzCaseContext::for($lead);
                    $values[$m['pdf_field']] = $ctx[$m['source']] ?? '';
                }
                if ($assignmentState === 'submitted') {
                    $values['phone'] = '+64 21 555 0200'; // client-corrected
                }

                CaseFormAssignment::updateOrCreate(
                    ['lead_id' => $lead->id, 'inz_form_id' => $form1012->id],
                    [
                        'inz_form_version_id' => $version?->id,
                        'status' => $assignmentState,
                        'field_values' => $values,
                        'assigned_by' => $adviser?->id,
                        'submitted_at' => $assignmentState === 'submitted' ? now()->subDay() : null,
                    ],
                );
            }
        }

        // Generate one real draft (from the submitted client answers) so the
        // register shows a "Generated · View" row at the top out of the box.
        $submitted = Lead::where('lead_id', 'CASE-DEMO-01')->first();
        if ($submitted) {
            $version = $form1012->currentVersion();
            $assign = CaseFormAssignment::where('lead_id', $submitted->id)->where('inz_form_id', $form1012->id)->first();
            $filler = app(\App\Services\Immigration\InzFormFiller::class);
            try {
                $bytes = $filler->fillWithValues($version, $assign?->field_values ?? []);
                $path = "inz-generated/{$submitted->id}/demo-inz1012.pdf";
                Storage::disk('local')->put($path, $bytes);

                \App\Models\LeadDocument::updateOrCreate(
                    ['lead_id' => $submitted->id, 'source_variant' => 'inz:INZ1012'],
                    [
                        'original_name' => "INZ1012 - {$form1012->name} (DEMO).pdf",
                        'file_path' => $path,
                        'mime' => 'application/pdf',
                        'size' => strlen($bytes),
                        'source' => 'generated',
                        'inz_form_version_id' => $version?->id,
                        'status' => 'StaffShared',
                        'uploaded_by' => $adviser?->id,
                        'note' => 'Draft — INZ1012 DEMO. Review before filing (step 10).',
                    ],
                );
                if ($assign) {
                    $assign->forceFill(['status' => 'reviewed', 'reviewed_by' => $adviser?->id, 'reviewed_at' => now()])->save();
                }
            } catch (\Throwable $e) {
                $this->command?->warn('Demo draft generation skipped: '.$e->getMessage());
            }
        }

        $this->command?->info('INZ Forms demo seeded: Student category, INZ1012 (ready) + INZ1014 (no PDF), 3 cases, 2 assignments, 1 generated draft.');
    }

    /** Reuse an LIA/immigration/admin user as the demo adviser, else any user. */
    private function demoAdviser(): ?User
    {
        return User::whereNotNull('iaa_licence_number')->first()
            ?? User::where('role', 'immigration')->first()
            ?? User::where('role', 'admin')->first()
            ?? User::first();
    }

    /**
     * Build a minimal but valid fillable AcroForm PDF (text fields) as a local
     * stand-in for an official INZ PDF. FPDM parses line-by-line, so every dict
     * entry sits on its own line and `/T (name)` is isolated.
     */
    private function buildDemoAcroform(): string
    {
        $fields = [
            ['name' => 'family_name',     'label' => 'Family name (surname)',        'y' => 720],
            ['name' => 'given_names',     'label' => 'Given names',                  'y' => 680],
            ['name' => 'date_of_birth',   'label' => 'Date of birth (DD/MM/YYYY)',   'y' => 640],
            ['name' => 'nationality',     'label' => 'Nationality',                  'y' => 600],
            ['name' => 'passport_number', 'label' => 'Passport number',              'y' => 560],
            ['name' => 'passport_expiry', 'label' => 'Passport expiry (DD/MM/YYYY)', 'y' => 520],
            ['name' => 'email',           'label' => 'Email address',                'y' => 480],
            ['name' => 'phone',           'label' => 'Contact phone',                'y' => 440],
        ];

        $esc = fn (string $s) => str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $s);

        $fontObj = 5;
        $firstField = 6;
        $refs = [];
        foreach ($fields as $i => $f) {
            $refs[] = ($firstField + $i).' 0 R';
        }
        $annots = implode(' ', $refs);

        $content = "BT /Helv 15 Tf 60 790 Td (".$esc('INZ1012 DEMO — Student Visa (local sample, not official)').") Tj ET\n0.6 0.6 0.6 RG\n";
        foreach ($fields as $f) {
            $ly = $f['y'] + 16;
            $content .= "BT /Helv 9 Tf 60 {$ly} Td (".$esc($f['label']).") Tj ET\n0.5 w 60 {$f['y']} m 520 {$f['y']} l S\n";
        }

        $objects = [];
        $objects[1] = "<<\n/Type /Catalog\n/Pages 2 0 R\n/AcroForm <<\n/Fields [{$annots}]\n/NeedAppearances true\n/DA (/Helv 0 Tf 0 g)\n/DR << /Font << /Helv {$fontObj} 0 R >> >>\n>>\n>>";
        $objects[2] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
        $objects[3] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /Helv {$fontObj} 0 R >> >> /Contents 4 0 R /Annots [{$annots}] >>";
        $objects[4] = "<< /Length ".strlen($content)." >>\nstream\n{$content}endstream";
        $objects[5] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
        foreach ($fields as $i => $f) {
            $num = $firstField + $i;
            $rect = '60 '.($f['y'] + 2).' 520 '.($f['y'] + 18);
            $objects[$num] = "<<\n/Type /Annot\n/Subtype /Widget\n/FT /Tx\n/T (".$esc($f['name']).")\n/Rect [{$rect}]\n/F 4\n/DA (/Helv 11 Tf 0 g)\n/Ff 0\n/P 3 0 R\n>>";
        }

        ksort($objects);
        $pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
        $offsets = [];
        foreach ($objects as $num => $body) {
            $offsets[$num] = strlen($pdf);
            $pdf .= "{$num} 0 obj\n{$body}\nendobj\n";
        }
        $xrefPos = strlen($pdf);
        $count = count($objects) + 1;
        $pdf .= "xref\n0 {$count}\n0000000000 65535 f \n";
        for ($n = 1; $n < $count; $n++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$n]);
        }
        $pdf .= "trailer\n<< /Size {$count} /Root 1 0 R >>\nstartxref\n{$xrefPos}\n%%EOF";

        return $pdf;
    }
}
