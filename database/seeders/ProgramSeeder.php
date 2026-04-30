<?php

namespace Database\Seeders;

use App\Models\Program;
use Illuminate\Database\Seeder;

class ProgramSeeder extends Seeder
{
    public function run(): void
    {
        $programs = [
            // Level 5 — Diplomas
            ['level' => 5, 'title' => 'NZ Diploma in Enrolled Nursing', 'institution' => 'Southern Institute of Tech', 'category' => 'diplomas'],
            ['level' => 5, 'title' => 'NZ Diploma in Enrolled Nursing', 'institution' => 'Wintec', 'category' => 'diplomas'],
            ['level' => 5, 'title' => 'NZ Diploma in Early Childhood Education', 'institution' => 'NZTC', 'category' => 'diplomas'],
            ['level' => 5, 'title' => 'New Zealand Diploma in Hospitality Management', 'institution' => 'PIHMS', 'category' => 'diplomas'],
            ['level' => 5, 'title' => 'NZ Diploma in IT Technical Support', 'institution' => 'NZSE', 'category' => 'diplomas'],
            ['level' => 5, 'title' => 'NZ Diploma in IT Technical Support', 'institution' => 'International College of Auckland', 'category' => 'diplomas'],

            // Level 6
            ['level' => 6, 'title' => 'NZ Diploma in Engineering - Electronics', 'institution' => 'ICA', 'category' => 'diplomas'],
            ['level' => 6, 'title' => 'NZ Diploma in Engineering - Electrical', 'institution' => 'ICA', 'category' => 'diplomas'],
            ['level' => 6, 'title' => 'NZ Diploma in Engineering - Electronics', 'institution' => 'NZSE', 'category' => 'diplomas'],
            ['level' => 6, 'title' => 'NZ Diploma in Engineering - Civil/Mechanical', 'institution' => 'Southern Institute of Tech', 'category' => 'diplomas'],

            // Level 7 — Bachelors
            ['level' => 7, 'title' => 'Bachelor of Accounting', 'institution' => 'Wintec', 'category' => 'bachelors', 'price_text' => '180,000!'],
            ['level' => 7, 'title' => 'Bachelor of Nursing', 'institution' => 'Wintec', 'category' => 'bachelors', 'price_text' => '180,000!'],
            ['level' => 7, 'title' => 'Bachelor of Applied Hotel Management', 'institution' => 'PIHMS', 'category' => 'bachelors', 'price_text' => '180,000!'],
            ['level' => 7, 'title' => 'Bachelor of Applied Information Technology', 'institution' => 'Whitecliffe', 'category' => 'bachelors', 'price_text' => '180,000!'],
            ['level' => 7, 'title' => 'Bachelors of Applied Information Technology', 'institution' => 'Wintec', 'category' => 'bachelors', 'price_text' => '180,000!'],
            ['level' => 7, 'title' => 'Bachelor of Computer and Information Sciences', 'institution' => 'AUT', 'category' => 'bachelors', 'price_text' => '180,000!'],
            ['level' => 7, 'title' => 'Bachelor of Engineering Technology', 'institution' => 'AUT', 'category' => 'bachelors', 'price_text' => '180,000!'],
            ['level' => 7, 'title' => 'Bachelor of Engineering (Honours)', 'institution' => 'AUT', 'category' => 'bachelors', 'price_text' => '180,000!'],
            ['level' => 7, 'title' => 'Bachelor of Software Engineering', 'institution' => 'Yoobee', 'category' => 'bachelors', 'price_text' => '180,000!'],
            ['level' => 7, 'title' => 'Bachelor of Engineering Technology', 'institution' => 'Wintec', 'category' => 'bachelors', 'price_text' => '180,000!'],
            ['level' => 7, 'title' => 'Bachelor of Applied Management', 'institution' => 'Wintec', 'category' => 'bachelors', 'price_text' => '180,000!'],
            ['level' => 7, 'title' => 'Bachelor of Applied Management', 'institution' => 'Future Skills', 'category' => 'bachelors', 'price_text' => '180,000!'],
            ['level' => 7, 'title' => 'Bachelors in Applied Management', 'institution' => 'ATMC', 'category' => 'bachelors', 'price_text' => '180,000!'],
            ['level' => 7, 'title' => 'Bachelor of Teaching (ECE)', 'institution' => 'NZTC', 'category' => 'bachelors', 'price_text' => '180,000!'],
            ['level' => 7, 'title' => 'Bachelor of Teaching (ECE)', 'institution' => 'Te Rito Maioha', 'category' => 'bachelors', 'price_text' => '180,000!'],
            ['level' => 7, 'title' => 'Bachelor of Teaching (Primary)', 'institution' => 'Te Rito Maioha', 'category' => 'bachelors', 'price_text' => '180,000!'],

            // Level 7 — Diplomas / Graduate Diplomas
            ['level' => 7, 'title' => 'Graduate Diploma in Teaching (ECE)', 'institution' => 'ICL Graduate Business School', 'category' => 'diplomas'],
            ['level' => 7, 'title' => 'Graduate Diploma in Teaching (ECE)', 'institution' => 'NZTC', 'category' => 'diplomas'],
            ['level' => 7, 'title' => 'NZ Diploma in Healthcare Management', 'institution' => 'ATMC', 'category' => 'diplomas'],
            ['level' => 7, 'title' => 'Diploma in Applied Network and Cloud Tech', 'institution' => 'NZSE', 'category' => 'diplomas'],
            ['level' => 7, 'title' => 'Diploma in Community Healthcare and Support', 'institution' => 'NZSE', 'category' => 'diplomas'],
            ['level' => 7, 'title' => 'Diploma in Software Development', 'institution' => 'ATMC', 'category' => 'diplomas'],
            ['level' => 7, 'title' => 'Graduate Diploma in Teaching (ECE)', 'institution' => 'NZTC', 'category' => 'diplomas'],
            ['level' => 7, 'title' => 'Graduate Diploma of Teaching (Primary)', 'institution' => 'Te Rito Maioha', 'category' => 'diplomas'],
            ['level' => 7, 'title' => 'Graduate Diploma of Teaching (ECE)', 'institution' => 'Te Rito Maioha', 'category' => 'diplomas'],

            // Level 8
            ['level' => 8, 'title' => 'Postgraduate Diploma in AI Integrated Solutions', 'institution' => 'Future Skills', 'category' => 'masters'],
            ['level' => 8, 'title' => 'Postgraduate Diploma in Applied Hotel Management', 'institution' => 'PIHMS', 'category' => 'masters'],
            ['level' => 8, 'title' => 'Postgraduate Diploma in Healthcare (Addiction Support)', 'institution' => 'NZSE', 'category' => 'masters'],
            ['level' => 8, 'title' => 'Postgraduate Certificate in Business Administration (PGCBA)', 'institution' => 'Auckland Institute of Studies', 'category' => 'masters'],

            // Level 9
            ['level' => 9, 'title' => 'Master of Business Informatics', 'institution' => 'ICL Graduate Business School', 'category' => 'masters'],
            ['level' => 9, 'title' => 'Master of Business Informatics (Thesis)', 'institution' => 'ICL Graduate Business School', 'category' => 'masters'],
            ['level' => 9, 'title' => 'Master of Management', 'institution' => 'ICL Graduate Business School', 'category' => 'masters'],
            ['level' => 9, 'title' => 'Master of Management (Thesis)', 'institution' => 'ICL Graduate Business School', 'category' => 'masters'],
            ['level' => 9, 'title' => 'Master of Management (Healthcare)', 'institution' => 'ICL Graduate Business School', 'category' => 'masters'],
            ['level' => 9, 'title' => 'Master of Business Administration', 'institution' => 'Auckland Institute of Studies', 'category' => 'masters'],
            ['level' => 9, 'title' => 'Master of Information Technology', 'institution' => 'Auckland Institute of Studies', 'category' => 'masters'],
            ['level' => 9, 'title' => 'Master of Applied Hotel Management', 'institution' => 'PIHMS', 'category' => 'masters'],
            ['level' => 9, 'title' => 'Master of Business Informatics', 'institution' => 'Yoobee', 'category' => 'masters'],
            ['level' => 9, 'title' => 'Master of Software Engineering', 'institution' => 'Yoobee', 'category' => 'masters'],
            ['level' => 9, 'title' => 'Master of Information Technology', 'institution' => 'Whitecliffe', 'category' => 'masters'],
            ['level' => 9, 'title' => 'Master of Teaching and Learning (ECE)', 'institution' => 'NZTC', 'category' => 'masters'],
            ['level' => 9, 'title' => 'Master of Applied Management', 'institution' => 'Southern Institute of Tech', 'category' => 'masters'],
            ['level' => 9, 'title' => 'Master of Information Technology', 'institution' => 'Southern Institute of Tech', 'category' => 'masters'],
            ['level' => 9, 'title' => 'Master of Applied Health Sciences (Rehab)', 'institution' => 'Southern Institute of Tech', 'category' => 'masters'],
            ['level' => 9, 'title' => 'Master of Applied Management', 'institution' => 'Wintec', 'category' => 'masters'],
            ['level' => 9, 'title' => 'Master of Applied Information Technology', 'institution' => 'Wintec', 'category' => 'masters'],
            ['level' => 9, 'title' => 'Master of Nursing Science (Pre-Registration)', 'institution' => 'Wintec', 'category' => 'masters'],
            ['level' => 9, 'title' => 'Master of AI Integrated IT Solutions', 'institution' => 'Future Skills', 'category' => 'masters'],
            ['level' => 9, 'title' => 'Master of Nursing Science', 'institution' => 'Eastern Institute of Tech', 'category' => 'masters'],
            ['level' => 9, 'title' => 'Master of Applied Management', 'institution' => 'Future Skills', 'category' => 'masters'],
        ];

        foreach ($programs as $i => $p) {
            $isNursingExample = $i === 0;

            Program::create(array_merge([
                'price_text' => 'Contact for price',
                'status' => 'published',
                'location' => null,
                'description' => null,
                'intake_months' => null,
                'duration_months' => null,
                'credits' => null,
                'residency_points' => null,
                'hours_per_week' => null,
                'entry_requirements' => null,
                'specialization' => null,
                'employment_outcomes' => null,
                'post_study' => null,
                'other_benefits' => null,
                'fee_guide' => null,
                'insurance_fee' => null,
                'visa_processing_fee' => null,
                'living_expense' => null,
                'accommodation' => null,
            ], $p, $isNursingExample ? $this->nursingDetails() : []));
        }
    }

    private function nursingDetails(): array
    {
        return [
            'location' => 'Auckland',
            'description' => "This program is for those who want to work in clinical settings as an enrolled nurse and a valued member of the health team. Students will gain knowledge in nursing, social science, and the structure and function of the human body.\n\n".
                "They will learn skills in simulated learning environments which can then be applied on placements in clinical practice. A range of clinical courses in different health care settings will prepare students to practice in areas including rehabilitation, acute care and mental health.\n\n".
                'After completing this program students will be able to apply to the Nursing Council of New Zealand to sit an exam to be registered as an Enrolled Nurse; this means they will be able to practice under the direction of a Registered Nurse.',
            'intake_months' => 'February, July',
            'duration_months' => 18,
            'credits' => 180,
            'residency_points' => 3,
            'hours_per_week' => 25,
            'entry_requirements' => "Completion of equivalent secondary education to New Zealand's NCEA Level 2. Some institutions may require credits in English and Mathematics.",
            'specialization' => 'Clinical practice across multiple care settings — rehabilitation, acute care, and mental health.',
            'other_benefits' => [
                'Pathway to Bachelor of Nursing',
                'Industry placement included',
                'Free uniform and equipment kit',
            ],
            'employment_outcomes' => [
                [
                    'intro' => "Graduates of New Zealand's Enrolled Nursing diploma find a wide range of opportunities across the health sector.",
                    'bullets' => [],
                ],
                [
                    'intro' => 'Common employment settings:',
                    'bullets' => [
                        'Hospitals',
                        'Aged care facilities',
                        'Mental health services',
                        'Community health settings',
                    ],
                ],
                [
                    'intro' => 'Salary and demand:',
                    'bullets' => [
                        'Starting salaries average NZD $50,000-$60,000',
                        'Rises with experience and specialisation',
                        'Some competition exists for entry-level positions',
                    ],
                ],
            ],
            'post_study' => 'Graduates who complete an Enrolled Nursing qualification (typically a Level 5 Diploma) in New Zealand can apply for a Post Study Work Visa (PSWV). This visa allows them to work for any employer in the health sector, often for up to 1-2 years, provided they have completed a 60-week full-time course and hold a valid registration with the Nursing Council of New Zealand.',
            'fee_guide' => [
                ['region' => 'India & Subcontinent', 'fee' => 31200],
                ['region' => 'Southeast Asia', 'fee' => 31200],
                ['region' => 'China/Malaysia/Singapore', 'fee' => 31200],
                ['region' => 'LATAM/Europe/Africa/Middle East', 'fee' => 31200],
            ],
            'insurance_fee' => 1000,
            'visa_processing_fee' => 2350,
            'living_expense' => 20000,
            'accommodation' => 'from $180/week',
        ];
    }
}
