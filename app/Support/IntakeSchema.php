<?php

namespace App\Support;

/**
 * Server-side mirror of the per-type intake section schema used by
 * resources/js/pages/portal/immigration/IntakeDetails.jsx. Kept in sync so the
 * downloadable PDF shows the same curated sections/labels as the on-screen
 * viewer. Each field is ['key' => .., 'label' => .., 'kind' => date|money|json,
 * 'multiline' => bool]; only `key` is required.
 */
class IntakeSchema
{
    private const COMMON_PERSONAL = [
        ['key' => 'first_name', 'label' => 'First name'],
        ['key' => 'family_name', 'label' => 'Family name'],
        ['key' => 'gender', 'label' => 'Gender'],
        ['key' => 'dob', 'label' => 'Date of birth', 'kind' => 'date'],
        ['key' => 'country_of_citizenship', 'label' => 'Country of citizenship'],
    ];

    private const COMMON_IDENTITY = [
        ['key' => 'passport_number', 'label' => 'Passport number'],
        ['key' => 'passport_country', 'label' => 'Passport country'],
        ['key' => 'passport_expiry', 'label' => 'Passport expiry', 'kind' => 'date'],
        ['key' => 'partnership_status', 'label' => 'Partnership status'],
    ];

    private const COMMON_NZ_HISTORY = [
        ['key' => 'current_country', 'label' => 'Current country'],
        ['key' => 'been_to_nz', 'label' => 'Been to NZ'],
        ['key' => 'last_nz_arrival', 'label' => 'Last NZ arrival', 'kind' => 'date'],
        ['key' => 'last_nz_departure', 'label' => 'Last NZ departure', 'kind' => 'date'],
        ['key' => 'over_24_months', 'label' => 'Stayed over 24 months'],
    ];

    private const COMMON_CHARACTER = [
        ['key' => 'character_convicted', 'label' => 'Convicted of an offence'],
        ['key' => 'character_investigation', 'label' => 'Under investigation'],
        ['key' => 'character_deported', 'label' => 'Previously deported'],
        ['key' => 'character_visa_refused', 'label' => 'Visa previously refused'],
        ['key' => 'lived_other_country_5y', 'label' => 'Lived in another country 5y+'],
        ['key' => 'lived_other_country_details', 'label' => 'Details', 'multiline' => true],
    ];

    private const COMMON_HEALTH = [
        ['key' => 'health_tb', 'label' => 'TB / chest condition'],
        ['key' => 'health_renal', 'label' => 'Renal condition'],
        ['key' => 'health_hospital', 'label' => 'Recent hospitalisation'],
        ['key' => 'health_residential', 'label' => 'Residential care'],
        ['key' => 'health_pregnant', 'label' => 'Pregnant'],
    ];

    private const COMMON_EMPLOYMENT_CURRENT = [
        ['key' => 'currently_working', 'label' => 'Currently working'],
        ['key' => 'current_job_title', 'label' => 'Current job title'],
        ['key' => 'current_job_duties', 'label' => 'Job duties', 'multiline' => true],
        ['key' => 'current_job_start', 'label' => 'Job started', 'kind' => 'date'],
        ['key' => 'current_job_finish', 'label' => 'Job finished', 'kind' => 'date'],
    ];

    private const COMMON_MILITARY = [
        ['key' => 'military_compulsory', 'label' => 'Compulsory service'],
        ['key' => 'military_undertaken', 'label' => 'Service undertaken'],
        ['key' => 'military_details', 'label' => 'Details', 'multiline' => true],
    ];

    private const COMMON_DECLARATION = [
        ['key' => 'declaration_accepted', 'label' => 'Declaration accepted'],
        ['key' => 'signature_name', 'label' => 'Signature name'],
        ['key' => 'signature_date', 'label' => 'Signature date', 'kind' => 'date'],
    ];

    /** Return the ordered sections for a given intake type. */
    public static function for(string $type): array
    {
        return self::all()[$type] ?? self::all()['work'];
    }

    /** The headline (most defining) section title per type. */
    public static function headlineTitle(string $type): ?string
    {
        return [
            'resident' => 'Passport & visa',
            'work' => 'Job offer',
            'student' => 'Study plan',
            'visitor' => 'Visit details',
        ][$type] ?? null;
    }

    private static function all(): array
    {
        return [
            'resident' => [
                ['title' => 'Personal details', 'fields' => [
                    ['key' => 'first_name', 'label' => 'First name'],
                    ['key' => 'last_name', 'label' => 'Last name'],
                    ['key' => 'dob', 'label' => 'Date of birth', 'kind' => 'date'],
                    ['key' => 'nationality', 'label' => 'Nationality'],
                ]],
                ['title' => 'Passport & visa', 'fields' => [
                    ['key' => 'passport_number', 'label' => 'Passport number'],
                    ['key' => 'passport_expiry', 'label' => 'Passport expiry', 'kind' => 'date'],
                    ['key' => 'issuing_country', 'label' => 'Issuing country'],
                    ['key' => 'current_visa_type', 'label' => 'Current NZ visa'],
                    ['key' => 'current_visa_other', 'label' => 'Visa (other)'],
                    ['key' => 'current_visa_expiry', 'label' => 'Current visa expiry', 'kind' => 'date'],
                    ['key' => 'nz_arrival_date', 'label' => 'NZ arrival date', 'kind' => 'date'],
                    ['key' => 'previous_nz_visa_history', 'label' => 'Previous NZ visa history', 'multiline' => true],
                ]],
                ['title' => 'Contact', 'fields' => [
                    ['key' => 'email', 'label' => 'Email'],
                    ['key' => 'phone', 'label' => 'Phone'],
                ]],
                ['title' => 'Employment', 'fields' => [
                    ['key' => 'job_title', 'label' => 'Job title'],
                    ['key' => 'employment_start', 'label' => 'Employment start', 'kind' => 'date'],
                    ['key' => 'employment_type', 'label' => 'Employment type'],
                    ['key' => 'hourly_rate', 'label' => 'Hourly rate (NZD)', 'kind' => 'money'],
                ]],
                ['title' => 'Qualifications', 'fields' => [
                    ['key' => 'highest_qualification', 'label' => 'Highest qualification'],
                    ['key' => 'institution_name', 'label' => 'Institution'],
                    ['key' => 'country_of_study', 'label' => 'Country of study'],
                    ['key' => 'nzqa_status', 'label' => 'NZQA / IQA status'],
                    ['key' => 'nzqa_iqa_reference', 'label' => 'IQA reference'],
                ]],
                ['title' => 'Work experience', 'fields' => [
                    ['key' => 'nz_skilled_years', 'label' => 'NZ skilled years'],
                    ['key' => 'total_skilled_years', 'label' => 'Total skilled years'],
                    ['key' => 'career_summary', 'label' => 'Career summary', 'multiline' => true],
                ]],
                ['title' => 'English language', 'fields' => [
                    ['key' => 'english_evidence', 'label' => 'Evidence'],
                    ['key' => 'english_test_score', 'label' => 'Test score / band'],
                    ['key' => 'english_test_date', 'label' => 'Test date', 'kind' => 'date'],
                ]],
                ['title' => 'Family', 'fields' => [
                    ['key' => 'include_family', 'label' => 'Include family'],
                    ['key' => 'family_members', 'label' => 'Family members', 'kind' => 'json'],
                ]],
                ['title' => 'Disclosures', 'fields' => [
                    ['key' => 'character_health_disclosure', 'label' => 'Character / health matters', 'multiline' => true],
                    ['key' => 'other_notes', 'label' => 'Other notes', 'multiline' => true],
                ]],
            ],

            'work' => [
                ['title' => 'Personal details', 'fields' => self::COMMON_PERSONAL],
                ['title' => 'Identity', 'fields' => self::COMMON_IDENTITY],
                ['title' => 'Contact', 'fields' => [
                    ['key' => 'email', 'label' => 'Email'],
                    ['key' => 'phone', 'label' => 'Phone'],
                    ['key' => 'current_address', 'label' => 'Current address', 'multiline' => true],
                ]],
                ['title' => 'NZ history', 'fields' => self::COMMON_NZ_HISTORY],
                ['title' => 'Job offer', 'fields' => [
                    ['key' => 'employer_name', 'label' => 'Employer name'],
                    ['key' => 'employer_is_family', 'label' => 'Employer is family'],
                    ['key' => 'employer_family_relation', 'label' => 'Family relation'],
                    ['key' => 'self_employed', 'label' => 'Self employed'],
                    ['key' => 'job_start_date', 'label' => 'Job start date', 'kind' => 'date'],
                    ['key' => 'hourly_rate', 'label' => 'Hourly rate (NZD)', 'kind' => 'money'],
                    ['key' => 'supports_dependent_children', 'label' => 'Supports dependants'],
                ]],
                ['title' => 'Current employment', 'fields' => self::COMMON_EMPLOYMENT_CURRENT],
                ['title' => 'Previous roles', 'fields' => [['key' => 'previous_roles', 'label' => 'Previous roles', 'kind' => 'json']]],
                ['title' => 'Character', 'fields' => self::COMMON_CHARACTER],
                ['title' => 'Health', 'fields' => self::COMMON_HEALTH],
                ['title' => 'Family', 'fields' => [['key' => 'family_members', 'label' => 'Family members', 'kind' => 'json']]],
                ['title' => 'NZ contacts', 'fields' => [
                    ['key' => 'has_nz_contacts', 'label' => 'Has NZ contacts'],
                    ['key' => 'nz_contacts', 'label' => 'NZ contacts', 'kind' => 'json'],
                ]],
                ['title' => 'Military service', 'fields' => self::COMMON_MILITARY],
                ['title' => 'Travel history', 'fields' => [
                    ['key' => 'travelled_internationally', 'label' => 'Travelled internationally'],
                    ['key' => 'travel_trips', 'label' => 'Travel trips', 'kind' => 'json'],
                ]],
                ['title' => 'Declaration', 'fields' => self::COMMON_DECLARATION],
            ],

            'student' => [
                ['title' => 'Personal details', 'fields' => self::COMMON_PERSONAL],
                ['title' => 'Identity', 'fields' => self::COMMON_IDENTITY],
                ['title' => 'Contact', 'fields' => [
                    ['key' => 'email', 'label' => 'Email'],
                    ['key' => 'phone', 'label' => 'Phone'],
                    ['key' => 'current_address', 'label' => 'Current address', 'multiline' => true],
                    ['key' => 'overseas_address', 'label' => 'Overseas address', 'multiline' => true],
                ]],
                ['title' => 'NZ history', 'fields' => self::COMMON_NZ_HISTORY],
                ['title' => 'Study plan', 'fields' => [
                    ['key' => 'programmes', 'label' => 'Programmes', 'kind' => 'json'],
                    ['key' => 'study_period_from', 'label' => 'Study from', 'kind' => 'date'],
                    ['key' => 'study_period_to', 'label' => 'Study to', 'kind' => 'date'],
                    ['key' => 'school_name', 'label' => 'School name'],
                    ['key' => 'has_offer', 'label' => 'Has offer'],
                ]],
                ['title' => 'Finance', 'fields' => [
                    ['key' => 'has_enough_funds', 'label' => 'Has enough funds'],
                    ['key' => 'tuition_fee_nzd', 'label' => 'Tuition fee (NZD)', 'kind' => 'money'],
                    ['key' => 'living_expenses_nzd', 'label' => 'Living expenses (NZD)', 'kind' => 'money'],
                    ['key' => 'available_funds', 'label' => 'Available funds', 'kind' => 'json'],
                    ['key' => 'has_sponsor', 'label' => 'Has sponsor'],
                    ['key' => 'sponsor_relationship', 'label' => 'Sponsor relationship'],
                    ['key' => 'sponsor_income_source', 'label' => 'Sponsor income source'],
                    ['key' => 'can_provide_statements', 'label' => 'Can provide statements'],
                    ['key' => 'has_other_assets', 'label' => 'Has other assets'],
                    ['key' => 'other_assets_details', 'label' => 'Other assets details', 'multiline' => true],
                ]],
                ['title' => 'Qualifications', 'fields' => [['key' => 'qualifications', 'label' => 'Qualifications', 'kind' => 'json']]],
                ['title' => 'Current employment', 'fields' => self::COMMON_EMPLOYMENT_CURRENT],
                ['title' => 'Character', 'fields' => self::COMMON_CHARACTER],
                ['title' => 'Health', 'fields' => self::COMMON_HEALTH],
                ['title' => 'Family', 'fields' => [['key' => 'family_members', 'label' => 'Family members', 'kind' => 'json']]],
                ['title' => 'NZ contacts', 'fields' => [
                    ['key' => 'has_nz_contacts', 'label' => 'Has NZ contacts'],
                    ['key' => 'nz_contacts', 'label' => 'NZ contacts', 'kind' => 'json'],
                ]],
                ['title' => 'Military service', 'fields' => self::COMMON_MILITARY],
                ['title' => 'Travel history', 'fields' => [
                    ['key' => 'travelled_internationally', 'label' => 'Travelled internationally'],
                    ['key' => 'travel_trips', 'label' => 'Travel trips', 'kind' => 'json'],
                ]],
                ['title' => 'Declaration', 'fields' => self::COMMON_DECLARATION],
            ],

            'visitor' => [
                ['title' => 'Personal details', 'fields' => self::COMMON_PERSONAL],
                ['title' => 'Identity', 'fields' => self::COMMON_IDENTITY],
                ['title' => 'Contact & address', 'fields' => [
                    ['key' => 'email', 'label' => 'Email'],
                    ['key' => 'phone', 'label' => 'Phone'],
                    ['key' => 'current_address', 'label' => 'Current address', 'multiline' => true],
                    ['key' => 'town_city', 'label' => 'Town / city'],
                    ['key' => 'region', 'label' => 'Region'],
                    ['key' => 'postcode', 'label' => 'Postcode'],
                ]],
                ['title' => 'NZ history', 'fields' => self::COMMON_NZ_HISTORY],
                ['title' => 'Visit details', 'fields' => [
                    ['key' => 'purpose_of_visit', 'label' => 'Purpose of visit'],
                    ['key' => 'intended_stay_length', 'label' => 'Intended stay length'],
                    ['key' => 'intended_from', 'label' => 'Intended from', 'kind' => 'date'],
                    ['key' => 'intended_to', 'label' => 'Intended to', 'kind' => 'date'],
                    ['key' => 'multi_entry_plans', 'label' => 'Multi-entry plans'],
                    ['key' => 'has_leave_permit', 'label' => 'Has leave permit'],
                ]],
                ['title' => 'Funds', 'fields' => [
                    ['key' => 'travel_funds_description', 'label' => 'Travel funds', 'multiline' => true],
                    ['key' => 'can_provide_statements', 'label' => 'Can provide statements'],
                    ['key' => 'has_other_assets', 'label' => 'Has other assets'],
                    ['key' => 'other_assets_details', 'label' => 'Other assets details', 'multiline' => true],
                ]],
                ['title' => 'Education', 'fields' => [
                    ['key' => 'has_tertiary', 'label' => 'Has tertiary qualification'],
                    ['key' => 'qualification_name', 'label' => 'Qualification name'],
                    ['key' => 'qualification_duration', 'label' => 'Qualification duration'],
                    ['key' => 'qualification_completed', 'label' => 'Qualification completed'],
                    ['key' => 'education_provider', 'label' => 'Education provider'],
                ]],
                ['title' => 'Current employment', 'fields' => self::COMMON_EMPLOYMENT_CURRENT],
                ['title' => 'Character', 'fields' => self::COMMON_CHARACTER],
                ['title' => 'Health', 'fields' => array_merge(self::COMMON_HEALTH, [
                    ['key' => 'previous_xray', 'label' => 'Previous chest x-ray'],
                    ['key' => 'previous_inz1007', 'label' => 'Previous INZ 1007 medical'],
                    ['key' => 'inz_requested_medical', 'label' => 'INZ requested a medical'],
                    ['key' => 'previous_police_certificate', 'label' => 'Previous police certificate'],
                ])],
                ['title' => 'Family', 'fields' => [['key' => 'family_members', 'label' => 'Family members', 'kind' => 'json']]],
                ['title' => 'NZ contacts', 'fields' => [
                    ['key' => 'has_nz_contacts', 'label' => 'Has NZ contacts'],
                    ['key' => 'nz_contacts', 'label' => 'NZ contacts', 'kind' => 'json'],
                ]],
                ['title' => 'Military service', 'fields' => self::COMMON_MILITARY],
                ['title' => 'Travel history', 'fields' => [
                    ['key' => 'travelled_internationally', 'label' => 'Travelled internationally'],
                    ['key' => 'travel_trips', 'label' => 'Travel trips', 'kind' => 'json'],
                ]],
                ['title' => 'Declaration', 'fields' => self::COMMON_DECLARATION],
            ],
        ];
    }
}
