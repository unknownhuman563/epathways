<?php

namespace Database\Seeders;

use App\Models\VisaType;
use Illuminate\Database\Seeder;

class VisaTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['code' => 'STUDENT',           'name' => 'Student Visa',                    'category' => 'Student',  'expected_processing_days' => 40, 'inz_form_refs' => 'INZ1012, INZ1226', 'consultation_price_nzd' => 150.00, 'consultation_duration_minutes' => 30, 'estimated_minutes' => 10, 'icon' => 'GraduationCap', 'short_description' => 'Study at an NZQA-listed institution.'],
            ['code' => 'POST_STUDY_WORK',   'name' => 'Post-Study Work Visa',            'category' => 'Work',     'expected_processing_days' => 35, 'inz_form_refs' => 'INZ1015',          'consultation_price_nzd' => 180.00, 'consultation_duration_minutes' => 30, 'estimated_minutes' => 10, 'icon' => 'Briefcase',     'short_description' => 'Stay in NZ to work after completing your studies.'],
            ['code' => 'WORK_AEWV',         'name' => 'Accredited Employer Work Visa',   'category' => 'Work',     'expected_processing_days' => 35, 'inz_form_refs' => 'INZ1015, INZ1027', 'consultation_price_nzd' => 220.00, 'consultation_duration_minutes' => 45, 'estimated_minutes' => 15, 'icon' => 'Briefcase',     'short_description' => 'Employer-sponsored work visa under the AEWV framework.'],
            ['code' => 'PARTNER_RES',       'name' => 'Partner of NZer Resident Visa',   'category' => 'Resident', 'expected_processing_days' => 120,'inz_form_refs' => 'INZ1145, INZ1146', 'consultation_price_nzd' => 280.00, 'consultation_duration_minutes' => 45, 'estimated_minutes' => 20, 'icon' => 'Heart',         'short_description' => 'Residency on the basis of a partnership with a New Zealander.'],
            ['code' => 'PARTNER_WORK',      'name' => 'Partner of NZer Work Visa',       'category' => 'Work',     'expected_processing_days' => 80, 'inz_form_refs' => 'INZ1015, INZ1146', 'consultation_price_nzd' => 200.00, 'consultation_duration_minutes' => 30, 'estimated_minutes' => 15, 'icon' => 'Heart',         'short_description' => 'Work in NZ as the partner of a New Zealander.'],
            ['code' => 'SMC',               'name' => 'Skilled Migrant Resident Visa',   'category' => 'Resident', 'expected_processing_days' => 240,'inz_form_refs' => 'INZ1100',          'consultation_price_nzd' => 300.00, 'consultation_duration_minutes' => 60, 'estimated_minutes' => 25, 'icon' => 'Home',          'short_description' => 'Skilled Migrant Category pathway to permanent residency.'],
            ['code' => 'VISITOR',           'name' => 'Visitor Visa',                    'category' => 'Visitor',  'expected_processing_days' => 28, 'inz_form_refs' => 'INZ1017',          'consultation_price_nzd' => 120.00, 'consultation_duration_minutes' => 30, 'estimated_minutes' => 10, 'icon' => 'Plane',         'short_description' => 'Tourism, family visits, business meetings and other short stays.'],
            ['code' => 'WORKING_HOLIDAY',   'name' => 'Working Holiday Visa',            'category' => 'Work',     'expected_processing_days' => 14, 'inz_form_refs' => 'Online',           'consultation_price_nzd' => 140.00, 'consultation_duration_minutes' => 30, 'estimated_minutes' => 10, 'icon' => 'Globe',         'short_description' => 'Travel and work in NZ on a working holiday scheme.'],
        ];

        foreach ($types as $t) {
            VisaType::updateOrCreate(['code' => $t['code']], array_merge($t, ['active' => true]));
        }
    }
}
