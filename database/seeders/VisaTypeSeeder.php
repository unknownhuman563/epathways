<?php

namespace Database\Seeders;

use App\Models\VisaType;
use Illuminate\Database\Seeder;

class VisaTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['code' => 'STUDENT',           'name' => 'Student Visa',                    'category' => 'Student',  'expected_processing_days' => 40, 'inz_form_refs' => 'INZ1012, INZ1226'],
            ['code' => 'POST_STUDY_WORK',   'name' => 'Post-Study Work Visa',            'category' => 'Work',     'expected_processing_days' => 35, 'inz_form_refs' => 'INZ1015'],
            ['code' => 'WORK_AEWV',         'name' => 'Accredited Employer Work Visa',   'category' => 'Work',     'expected_processing_days' => 35, 'inz_form_refs' => 'INZ1015, INZ1027'],
            ['code' => 'PARTNER_RES',       'name' => 'Partner of NZer Resident Visa',   'category' => 'Resident', 'expected_processing_days' => 120, 'inz_form_refs' => 'INZ1145, INZ1146'],
            ['code' => 'PARTNER_WORK',      'name' => 'Partner of NZer Work Visa',       'category' => 'Work',     'expected_processing_days' => 80, 'inz_form_refs' => 'INZ1015, INZ1146'],
            ['code' => 'SMC',               'name' => 'Skilled Migrant Resident Visa',   'category' => 'Resident', 'expected_processing_days' => 240, 'inz_form_refs' => 'INZ1100'],
            ['code' => 'VISITOR',           'name' => 'Visitor Visa',                    'category' => 'Visitor',  'expected_processing_days' => 28, 'inz_form_refs' => 'INZ1017'],
            ['code' => 'WORKING_HOLIDAY',   'name' => 'Working Holiday Visa',            'category' => 'Work',     'expected_processing_days' => 14, 'inz_form_refs' => 'Online'],
        ];

        foreach ($types as $t) {
            VisaType::updateOrCreate(['code' => $t['code']], array_merge($t, ['active' => true]));
        }
    }
}
