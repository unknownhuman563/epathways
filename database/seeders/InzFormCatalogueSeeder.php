<?php

namespace Database\Seeders;

use App\Models\InzForm;
use App\Models\VisaType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * The INZ form catalogue + current-version register (as at 1 Aug 2026, per the
 * service-line list). Version files are uploaded later; this seeds the identity,
 * category, current version label and effective date so the register + lapse
 * warnings work before any PDF is on file. Idempotent (keyed on code).
 */
class InzFormCatalogueSeeder extends Seeder
{
    /** [code, name, category, current version label|null] */
    private const FORMS = [
        // Student
        ['INZ1012', 'Student Visa Application', 'Student', 'Nov 2025'],
        ['INZ1014', 'Financial Undertaking for a Student', 'Student', 'Jun 2025'],
        ['INZ1226', 'Student Visa Declaration', 'Student', 'Jun 2025'],
        // Work
        ['INZ1015', 'Work Visa Application', 'Work', 'Dec 2025'],
        ['INZ1113', 'Employer Supplementary Form', 'Work', 'Nov 2025'],
        ['INZ1225', 'Work Visa Declaration', 'Work', 'Aug 2025'],
        ['INZ1279', 'Employer Accreditation Declaration', 'Work', null],
        ['INZ1370', 'Migrant Exploitation Protection Work Visa', 'Work', 'Oct 2023'],
        // Visitor
        ['INZ1017', 'Visitor Visa Application', 'Visitor', 'Sep 2025'],
        ['INZ1224', 'Visitor Visa Declaration', 'Visitor', 'Aug 2025'],
        ['INZ1205', 'Additional Dependents for a Visitor Visa', 'Visitor', 'Feb 2018'],
        // Partnership
        ['INZ1146', 'Form for Partners Supporting Partnership-based Temporary Entry', 'Partnership', 'May 2026'],
        ['INZ1198', 'Partnership-Based Temporary Visa Application', 'Partnership', 'May 2025'],
        ['INZ1178', 'Partnership Support Form for Residence', 'Partnership', 'Mar 2021'],
        // Residence
        ['INZ1000', 'Residence under Family Category / Residence from Work', 'Residence', 'Sep 2025'],
        ['INZ1380', 'Skilled Residence Visa Application', 'Residence', 'Sep 2023'],
        ['INZ1115', 'Skilled Migrant Category Application for Residence', 'Residence', 'Jul 2021'],
        ['INZ1242', 'Resident Visa Declaration', 'Residence', 'May 2026'],
        ['INZ1206', 'Parent Category Residence Application', 'Residence', 'Nov 2023'],
        ['INZ1024', 'Sponsorship Form for Residence under Parent Category', 'Residence', 'Nov 2023'],
        // Cross-cutting
        ['INZ1160', 'Immigration Adviser Details', 'Cross-cutting', 'Mar 2021'],
        ['INZ1200', 'Additional Information Form', 'Cross-cutting', 'Sep 2023'],
        ['INZ1020', 'Variation of Conditions or Travel Conditions', 'Cross-cutting', 'Oct 2025'],
        ['INZ1023', 'Transfer or Confirmation of a Visa', 'Cross-cutting', 'Nov 2023'],
        ['INZ1134', 'Additional Details Form', 'Cross-cutting', 'Mar 2021'],
        ['INZ1007', 'General Medical Certificate', 'Cross-cutting', 'Dec 2020'],
        ['INZ1096', 'Chest X-ray Certificate', 'Cross-cutting', 'Dec 2020'],
        ['INZ1025', 'Sponsorship Form for Temporary Entry', 'Cross-cutting', 'Sep 2025'],
    ];

    /** Forms that attach to a Student visa type. required flag in the pivot. */
    private const STUDENT_FORMS = [
        'INZ1012' => true,   // application
        'INZ1014' => false,  // financial undertaking (if a guarantor)
        'INZ1226' => true,   // declaration (online-on-behalf)
        'INZ1160' => true,   // adviser details — on essentially every case
        'INZ1025' => false,  // sponsorship (if sponsored)
    ];

    public function run(): void
    {
        foreach (self::FORMS as [$code, $name, $category, $label]) {
            $form = InzForm::updateOrCreate(
                ['code' => $code],
                ['name' => $name, 'category' => $category, 'is_active' => true],
            );

            if ($label) {
                // One current version row per form (file uploaded later).
                $form->versions()->updateOrCreate(
                    ['version_label' => $label],
                    [
                        'is_current' => true,
                        'effective_from' => $this->parseLabel($label),
                        'checked_at' => now(),
                    ],
                );
            }
        }

        // Attach the Student-category form set to every Student visa type.
        $studentForms = InzForm::whereIn('code', array_keys(self::STUDENT_FORMS))->get()->keyBy('code');
        $studentVisaTypes = VisaType::where('category', 'Student')
            ->orWhere('name', 'like', '%student%')
            ->get();

        foreach ($studentVisaTypes as $vt) {
            $sync = [];
            foreach (self::STUDENT_FORMS as $code => $required) {
                if ($form = $studentForms->get($code)) {
                    $sync[$form->id] = ['required' => $required];
                }
            }
            $vt->inzForms()->syncWithoutDetaching($sync);
        }
    }

    /** "Nov 2025" → 2025-11-01 (first of month), or null. */
    private function parseLabel(string $label): ?string
    {
        try {
            return Carbon::createFromFormat('M Y', $label)->startOfMonth()->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }
}
