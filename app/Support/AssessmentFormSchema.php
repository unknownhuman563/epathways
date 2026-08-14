<?php

namespace App\Support;

use App\Models\FamilyIntake;
use App\Models\ResidentIntake;
use App\Models\StudentIntake;
use App\Models\VisitorIntake;
use App\Models\WorkIntake;

/**
 * The canonical per-visa-type assessment field layout — the server-side mirror
 * of resources/js/data/assessmentSections.js. Used to:
 *   - allowlist which intake columns the client may edit from their portal,
 *   - compute completeness (filled / total) deterministically (never AI-guessed).
 *
 * Keep the two files in step: same section titles, same field keys, same order.
 */
class AssessmentFormSchema
{
    /** @return array<string, array<int, string>> section title => ordered column keys */
    public static function schema(string $type): array
    {
        return match ($type) {
            'resident' => [
                'Personal Details' => ['dob', 'nationality'],
                'Passport & Visa' => ['passport_number', 'passport_expiry', 'issuing_country', 'current_visa_type', 'current_visa_other', 'current_visa_expiry', 'nz_arrival_date', 'previous_nz_visa_history'],
                'Employment' => ['job_title', 'employment_start', 'employment_type', 'hourly_rate'],
                'Qualifications' => ['highest_qualification', 'institution_name', 'country_of_study', 'nzqa_status', 'nzqa_iqa_reference'],
                'Work Experience' => ['nz_skilled_years', 'total_skilled_years', 'career_summary'],
                'English & Family' => ['english_evidence', 'english_test_score', 'english_test_date', 'include_family'],
                'Additional Information' => ['character_health_disclosure', 'other_notes'],
            ],
            'work' => [
                'Identity' => ['other_names', 'gender', 'dob', 'country_of_birth', 'place_of_birth', 'country_of_citizenship', 'other_citizenships', 'national_id', 'partnership_status', 'current_address'],
                'NZ Immigration History' => ['current_country', 'previous_nz_visa', 'previous_nz_visa_details', 'previous_nzeta', 'australian_pr', 'travelled_nz', 'last_nz_departure', 'over_24_months'],
                'NZ Employer' => ['employer_name', 'employer_is_family', 'employer_family_relation', 'self_employed', 'job_start_date', 'hourly_rate', 'supports_dependent_children'],
                'Character' => ['character_convicted', 'character_investigation', 'character_deported', 'character_visa_refused', 'lived_other_country_5y', 'lived_other_country_details'],
                'Health' => ['health_tb', 'health_renal', 'health_hospital', 'health_residential', 'health_pregnant'],
                'Current Employment' => ['currently_working', 'current_job_title', 'current_job_start', 'current_job_country', 'current_job_region', 'current_employer_name', 'current_employer_phone', 'current_employer_email', 'current_job_duties', 'current_employer_address'],
                'Military & Travel' => ['military_compulsory', 'military_undertaken', 'military_details', 'travelled_internationally'],
                'Declaration' => ['declaration_accepted', 'signature_name', 'signature_date'],
            ],
            'student' => [
                'Identity' => ['other_names', 'gender', 'dob', 'country_of_birth', 'place_of_birth', 'country_of_citizenship', 'other_citizenships', 'national_id', 'passport_number', 'passport_expiry', 'partnership_status', 'current_address', 'overseas_address'],
                'NZ Immigration History' => ['current_country', 'travelled_nz', 'last_nz_departure', 'over_24_months'],
                'Character' => ['character_convicted', 'character_investigation', 'character_deported', 'character_visa_refused', 'lived_other_country_5y', 'lived_other_country_details'],
                'Health' => ['health_tb', 'health_renal', 'health_hospital', 'health_residential', 'health_pregnant'],
                'Current Employment' => ['currently_working', 'current_job_title', 'current_job_start', 'current_job_finish', 'current_job_country', 'current_job_region', 'current_employer_name', 'current_employer_phone', 'current_employer_email', 'current_job_duties', 'current_employer_address'],
                'Study Plan' => ['programmes', 'study_period_from', 'study_period_to', 'school_name', 'has_offer'],
                'Study Funds & Assets' => ['has_enough_funds', 'tuition_fee_nzd', 'living_expenses_nzd', 'has_sponsor', 'sponsor_relationship', 'sponsor_income_source', 'can_provide_statements', 'has_other_assets', 'other_assets_details'],
                'Declaration' => ['declaration_accepted', 'signature_name', 'signature_date'],
            ],
            'visitor' => [
                'Identity' => ['other_names', 'gender', 'dob', 'country_of_birth', 'place_of_birth', 'country_of_citizenship', 'passport_number', 'passport_expiry', 'other_citizenships', 'national_id', 'partnership_status', 'current_address', 'town_city', 'region', 'postcode'],
                'NZ Immigration History' => ['current_country', 'previous_nz_visa', 'previous_nzeta', 'australian_pr', 'travelled_nz', 'last_nz_departure', 'over_24_months'],
                'Character' => ['character_convicted', 'character_deported', 'character_investigation', 'character_visa_refused', 'lived_other_country_5y', 'previous_police_certificate'],
                'Health' => ['health_tb', 'health_renal', 'health_hospital', 'health_residential', 'health_pregnant', 'previous_xray', 'previous_inz1007', 'inz_requested_medical'],
                'Education' => ['has_tertiary', 'qualification_duration', 'qualification_name', 'qualification_completed', 'education_provider'],
                'Current Employment' => ['currently_working', 'current_job_title', 'current_job_start', 'current_job_finish', 'current_job_country', 'current_job_region', 'current_employer_name', 'current_employer_phone', 'current_employer_email', 'current_job_duties', 'current_employer_address'],
                'Travel Plan' => ['purpose_of_visit', 'intended_stay_length', 'intended_from', 'intended_to', 'has_leave_permit', 'multi_entry_plans'],
                'Travel Funds' => ['travel_funds_description', 'can_provide_statements', 'has_other_assets', 'other_assets_details'],
                'Declaration' => ['declaration_accepted', 'signature_name', 'signature_date'],
            ],
            'family' => [
                'Identity' => ['other_names', 'gender', 'dob', 'partnership_status', 'country_of_birth', 'place_of_birth', 'country_of_citizenship', 'other_citizenships', 'national_id'],
                'NZ Immigration' => ['current_country', 'previous_nz_visa', 'current_address'],
                'Visa Details' => ['applying_as', 'visa_type', 'partner_living_together', 'partner_12_months', 'partner_same_period', 'partner_close_relatives', 'child_dependent'],
                'Character' => ['character_convicted', 'character_removed', 'character_investigation', 'character_visa_refused', 'lived_other_country_5y', 'previous_police_certificate'],
                'Health' => ['health_tb', 'health_renal', 'health_hospital', 'health_residential', 'health_pregnant', 'previous_xray', 'previous_medical_cert', 'countries_visited_3m'],
                'Work History' => ['currently_working', 'current_employer_name', 'current_occupation', 'current_employer_phone', 'current_employer_email', 'current_start', 'current_end', 'current_employer_address'],
                'Contacts & Declaration' => ['nz_contacts', 'declaration_accepted', 'signature_name', 'signature_date'],
            ],
            default => [],
        };
    }

    /** Flat, ordered list of every field key for a visa type. */
    public static function fields(string $type): array
    {
        return array_merge(...array_values(self::schema($type))) ?: [];
    }

    /** Map an intake model instance to its type slug. */
    public static function typeForClass(string $class): ?string
    {
        return match ($class) {
            ResidentIntake::class => 'resident',
            WorkIntake::class => 'work',
            StudentIntake::class => 'student',
            VisitorIntake::class => 'visitor',
            FamilyIntake::class => 'family',
            default => null,
        };
    }

    /**
     * Deterministic completeness — how many schema fields the intake has filled.
     * Never AI-estimated. Returns [filled, total, pct].
     */
    public static function stats($intake, string $type): array
    {
        $attrs = $intake->getAttributes();
        $filled = 0;
        $total = 0;
        foreach (self::fields($type) as $col) {
            if (! array_key_exists($col, $attrs)) {
                continue;
            }
            $total++;
            $v = $intake->{$col};
            if (is_array($v)) {
                if (! empty($v)) {
                    $filled++;
                }
            } elseif (! ($v === null || $v === '')) {
                $filled++;
            }
        }
        $pct = $total > 0 ? (int) round($filled / $total * 100) : 0;

        return ['filled' => $filled, 'total' => $total, 'pct' => $pct];
    }

    /** Same as stats(), but from a plain values array (e.g. $intake->toArray()). */
    public static function statsFromArray(array $values, string $type): array
    {
        $filled = 0;
        $total = 0;
        foreach (self::fields($type) as $col) {
            if (! array_key_exists($col, $values)) {
                continue;
            }
            $total++;
            $v = $values[$col];
            $empty = is_array($v) ? empty($v) : ($v === null || $v === '');
            if (! $empty) {
                $filled++;
            }
        }
        $pct = $total > 0 ? (int) round($filled / $total * 100) : 0;

        return ['filled' => $filled, 'total' => $total, 'pct' => $pct];
    }

    /** Blank field keys from a plain values array. */
    public static function missingFromArray(array $values, string $type): array
    {
        $out = [];
        foreach (self::fields($type) as $col) {
            if (! array_key_exists($col, $values)) {
                continue;
            }
            $v = $values[$col];
            $empty = is_array($v) ? empty($v) : ($v === null || $v === '');
            if ($empty) {
                $out[] = $col;
            }
        }

        return $out;
    }

    /** The fields that are still blank — feeds the staff "what's missing" note. */
    public static function missing($intake, string $type): array
    {
        $attrs = $intake->getAttributes();
        $out = [];
        foreach (self::fields($type) as $col) {
            if (! array_key_exists($col, $attrs)) {
                continue;
            }
            $v = $intake->{$col};
            $empty = is_array($v) ? empty($v) : ($v === null || $v === '');
            if ($empty) {
                $out[] = $col;
            }
        }

        return $out;
    }
}
