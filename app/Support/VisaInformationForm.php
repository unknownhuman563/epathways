<?php

namespace App\Support;

use Illuminate\Support\Carbon;

/**
 * Builds the "Visa Information Form – General Application" section structure
 * (Sections A–K) from a Work / Student / Visitor intake, ready to render into
 * the official ePathways VIF PDF layout. Every question in the printed form is
 * represented; the applicant's submitted value fills the "Your answer" column,
 * and questions with no matching data are left blank (as on the paper form).
 *
 * Row shapes consumed by resources/views/pdf/intake.blade.php:
 *   ['t' => 'q',    'q' => label, 'a' => answer]   a normal question row
 *   ['t' => 'sub',  'label' => text]               a blue sub-group header
 *   ['t' => 'note', 'label' => text]               a full-width italic instruction
 *   ['t' => 'check','label' => text, 'on' => bool] a declaration checkbox line
 *   ['t' => 'legal','label' => text]               the boxed legal paragraph
 */
class VisaInformationForm
{
    /** @return array{applicant:string,sections:array} */
    public static function build(array $in): array
    {
        return [
            'applicant' => trim(($in['first_name'] ?? '').' '.($in['family_name'] ?? $in['last_name'] ?? '')),
            'sections' => [
                self::sectionA($in),
                self::sectionB($in),
                self::sectionC($in),
                self::sectionD($in),
                self::sectionE($in),
                self::sectionF($in),
                self::sectionG($in),
                self::sectionH($in),
                self::sectionI($in),
                self::sectionJ($in),
                self::sectionK($in),
            ],
        ];
    }

    private static function sectionA(array $in): array
    {
        return ['letter' => 'A', 'title' => 'Identity Information', 'rows' => [
            self::q('Family name', self::v($in, 'family_name') ?: self::v($in, 'last_name')),
            self::q('First name(s)', self::v($in, 'first_name')),
            self::q('Middle Name', self::v($in, 'middle_name')),
            self::q('Have you ever used any other names? (if yes, list them)', self::v($in, 'other_names')),
            self::q('Gender', self::v($in, 'gender')),
            self::q('Date of birth', self::date($in, 'dob')),
            self::q('Country of birth', self::v($in, 'country_of_birth')),
            self::q('Place of birth (town / city)', self::v($in, 'place_of_birth')),
            self::q('Current physical address (room / building / street number, suburb, city, country)', self::v($in, 'current_address')),
            self::q('Most recent overseas address (house / building number, street, etc.)', self::v($in, 'overseas_address')),
            self::q('Email address', self::v($in, 'email')),
            self::q('Contact number', self::v($in, 'phone')),
            self::q('Country of citizenship', self::v($in, 'country_of_citizenship') ?: self::v($in, 'nationality')),
            self::q('Do you hold any other citizenships? (if yes, list them)', self::v($in, 'other_citizenships')),
            self::q('National ID number (if applicable)', self::v($in, 'national_id')),
            self::q('Passport number', self::v($in, 'passport_number')),
            self::q('Date of expiry', self::date($in, 'passport_expiry')),
            self::q('Partnership status (Single / Married / Divorced / Widowed / Partnership / etc.)', self::v($in, 'partnership_status')),
        ]];
    }

    private static function sectionB(array $in): array
    {
        return ['letter' => 'B', 'title' => 'New Zealand Immigration History', 'rows' => [
            self::q('What country will you be in when this application is submitted?', self::v($in, 'current_country')),
            self::q('Have you previously applied for a New Zealand visa? (Yes / No)', self::bool($in, 'previous_nz_visa')),
            self::sub('If Yes, complete below'),
            self::q('What type of visa', self::v($in, 'previous_nz_visa_type')),
            self::q('Entry date', self::date($in, 'previous_nz_entry')),
            self::q('Exit date', self::date($in, 'previous_nz_exit')),
            self::q('Have you previously requested an NZeTA? (Yes / No)', self::bool($in, 'requested_nzeta')),
            self::q('Do you hold an Australian Permanent Resident Visa? (Yes / No)', self::bool($in, 'australian_pr')),
            self::q('Have you ever travelled to New Zealand? If yes, when did you last leave New Zealand?', self::date($in, 'last_nz_departure')),
            self::q('Will your total time in New Zealand for all visits, including this proposed visit, equal 24 months or more? (Yes / No)', self::bool($in, 'over_24_months')),
        ]];
    }

    private static function sectionC(array $in): array
    {
        return ['letter' => 'C', 'title' => 'Character Details', 'rows' => [
            self::q('Have you ever been convicted, at any time, of any offence – including any driving offence? (Yes / No)', self::bool($in, 'character_convicted')),
            self::q('Are you currently under investigation, wanted for questioning, or facing charges for any offence in any country, including New Zealand? (Yes / No)', self::bool($in, 'character_investigation')),
            self::q('Have you ever been expelled, deported, excluded, removed from, or refused entry to any country? (Yes / No)', self::bool($in, 'character_deported')),
            self::q('Have you ever been refused a visa or permit by any country (excluding New Zealand)? (Yes / No)', self::bool($in, 'character_visa_refused')),
            self::q('Have you lived in any country for 5 years or more since the age of 17? (Yes / No)', self::bool($in, 'lived_other_country_5y')),
        ]];
    }

    private static function sectionD(array $in): array
    {
        return ['letter' => 'D', 'title' => 'Health Details', 'rows' => [
            self::q('Do you have tuberculosis? (Yes / No)', self::bool($in, 'health_tb')),
            self::q('Renal dialysis? (Yes / No)', self::bool($in, 'health_renal')),
            self::q('Hospital care? (Yes / No)', self::bool($in, 'health_hospital')),
            self::q('Residential care? (Yes / No)', self::bool($in, 'health_residential')),
            self::q('Are you pregnant? (Yes / No)', self::bool($in, 'health_pregnant')),
        ]];
    }

    private static function sectionE(array $in): array
    {
        $rows = [
            self::note('Have you undertaken any tertiary education (qualifications after high school)? If No, provide your highest qualification details. If Yes, provide all details of your tertiary education history.'),
        ];
        $entries = self::listOf($in, 'qualifications');
        if (empty($entries)) {
            $entries = [[]]; // one blank slot to preserve the form shape
        }
        foreach ($entries as $i => $e) {
            $rows[] = self::sub('Education '.($i + 1));
            $rows[] = self::q('Start date (year and month)', self::pick($e, ['start_date', 'from', 'start']));
            $rows[] = self::q('Finish date (year and month)', self::pick($e, ['finish_date', 'to', 'end', 'finish']));
            $rows[] = self::q('Qualification and major name', self::pick($e, ['qualification', 'name', 'major', 'title']));
            $rows[] = self::q('Qualification completed? (Yes / No)', self::pick($e, ['completed', 'is_completed']));
            $rows[] = self::q('School name', self::pick($e, ['school_name', 'school', 'institution', 'provider']));
            $rows[] = self::q('School location', self::pick($e, ['school_location', 'location', 'country']));
        }

        return ['letter' => 'E', 'title' => 'Education Details', 'rows' => $rows];
    }

    private static function sectionF(array $in): array
    {
        return ['letter' => 'F', 'title' => 'Current / Previous Employment', 'rows' => [
            self::q('Are you currently working? (Yes / No)', self::bool($in, 'currently_working')),
            self::note('If you are not working, please list the details of your most recent employment.'),
            self::q('Job position', self::v($in, 'current_job_title')),
            self::q('Detailed job duties', self::v($in, 'current_job_duties')),
            self::q('Start date', self::date($in, 'current_job_start')),
            self::q('Finish date', self::date($in, 'current_job_finish')),
            self::q('Country of work', self::v($in, 'work_country')),
            self::q('Region of work', self::v($in, 'work_region')),
            self::q('Name of organisation', self::v($in, 'employer_name')),
            self::q('Address of organisation', self::v($in, 'employer_address')),
            self::q('Employer phone number', self::v($in, 'employer_phone')),
            self::q('Employer email address', self::v($in, 'employer_email')),
        ]];
    }

    private static function sectionG(array $in): array
    {
        $rows = [self::note('There is no need to list deceased members.')];
        $members = self::listOf($in, 'family_members');
        if (empty($members)) {
            $rows[] = self::sub('1. Family member');
            foreach (['Name (first name and family name)', 'Date of birth', 'Partnership status', 'Country of residence', 'Country of birth', 'Country of citizenship', 'Occupation'] as $lbl) {
                $rows[] = self::q($lbl, '');
            }
        } else {
            foreach ($members as $i => $m) {
                $label = self::pick($m, ['relationship', 'relation', 'type']);
                $rows[] = self::sub(($i + 1).'. '.($label !== '' ? ucwords($label) : 'Family member'));
                $rows[] = self::q('Name (first name and family name)', self::pick($m, ['name', 'full_name', 'first_name']));
                $rows[] = self::q('Gender', self::pick($m, ['gender']));
                $rows[] = self::q('Date of birth', self::pick($m, ['dob', 'date_of_birth']));
                $rows[] = self::q('Country of residence', self::pick($m, ['country_of_residence', 'residence']));
                $rows[] = self::q('Country of birth', self::pick($m, ['country_of_birth', 'birth_country']));
                $rows[] = self::q('Country of citizenship', self::pick($m, ['country_of_citizenship', 'citizenship']));
                $rows[] = self::q('Occupation', self::pick($m, ['occupation']));
            }
        }

        return ['letter' => 'G', 'title' => 'Family Information', 'rows' => $rows];
    }

    private static function sectionH(array $in): array
    {
        $rows = [
            self::q('Do you have any contacts in New Zealand? (Yes / No)', self::bool($in, 'has_nz_contacts')),
            self::note('If yes, please provide the following details.'),
        ];
        $contacts = self::listOf($in, 'nz_contacts');
        $c = $contacts[0] ?? [];
        $rows[] = self::q('Contact’s first name', self::pick($c, ['first_name', 'name']));
        $rows[] = self::q('Contact’s family name', self::pick($c, ['family_name', 'last_name']));
        $rows[] = self::q('Contact’s relationship to you (family, friend, other)', self::pick($c, ['relationship', 'relation']));
        $rows[] = self::q('Contact’s address', self::pick($c, ['address']));
        $rows[] = self::q('Contact’s contact number', self::pick($c, ['phone', 'contact_number', 'number']));

        return ['letter' => 'H', 'title' => 'New Zealand Contacts', 'rows' => $rows];
    }

    private static function sectionI(array $in): array
    {
        return ['letter' => 'I', 'title' => 'Military Service', 'rows' => [
            self::q('Has military service been compulsory in your home country? (Yes / No)', self::bool($in, 'military_compulsory')),
            self::q('Have you ever undertaken military service in any country? (Yes / No)', self::bool($in, 'military_undertaken')),
        ]];
    }

    private static function sectionJ(array $in): array
    {
        $rows = [
            self::q('Have you ever travelled internationally (excluding to and from New Zealand)? (Yes / No)', self::bool($in, 'travelled_internationally')),
            self::note('If yes, provide details of your travel history in the last 5 years.'),
        ];
        $trips = self::listOf($in, 'travel_trips');
        if (empty($trips)) {
            $trips = [[]];
        }
        foreach ($trips as $i => $t) {
            if (count($trips) > 1) {
                $rows[] = self::sub('Trip '.($i + 1));
            }
            $rows[] = self::q('Destination (country)', self::pick($t, ['destination', 'country']));
            $rows[] = self::q('Date entered (year and month)', self::pick($t, ['entered', 'date_entered', 'from']));
            $rows[] = self::q('Date exited (year and month)', self::pick($t, ['exited', 'date_exited', 'to']));
            $rows[] = self::q('How did you arrive? (air / land / sea)', self::pick($t, ['arrival', 'mode', 'how']));
            $rows[] = self::q('Purpose of travel / type of visa', self::pick($t, ['purpose', 'visa']));
        }

        return ['letter' => 'J', 'title' => 'Travel History', 'rows' => $rows];
    }

    private static function sectionK(array $in): array
    {
        $accepted = self::truthy($in['declaration_accepted'] ?? null);

        return ['letter' => 'K', 'title' => 'Declaration', 'rows' => [
            self::check('I declare that the information I have provided above is true, correct and complete.', $accepted),
            self::check('I understand that I must inform Immigration New Zealand (INZ) of any relevant fact or change of circumstances that may affect the decision on my visa application (including if I may no longer meet the criteria for the visa for which I am applying), or affect the decision to grant entry permission based on that visa.', $accepted),
            self::note('Examples of matters you should inform INZ about include a change in employment or partnership status, a change in your health, or a new issue related to character requirements.'),
            self::legal('If false or misleading information is submitted, or relevant information is withheld, your application may be declined without further warning. You may be denied entry to New Zealand or made liable for deportation. If your visa has already been approved, it may be cancelled. It is an offence under the Immigration Act 2009 to provide false or misleading information in relation to a visa application, and you may be prosecuted.'),
            self::q('Applicant’s name (first name and family name)', self::v($in, 'signature_name') ?: trim(($in['first_name'] ?? '').' '.($in['family_name'] ?? $in['last_name'] ?? ''))),
            self::q('Applicant’s signature', ''),
            self::q('Date', self::date($in, 'signature_date')),
        ]];
    }

    // ── Row + value helpers ─────────────────────────────────────────────────

    private static function q(string $label, string $answer): array
    {
        return ['t' => 'q', 'q' => $label, 'a' => $answer];
    }

    private static function sub(string $label): array
    {
        return ['t' => 'sub', 'label' => $label];
    }

    private static function note(string $label): array
    {
        return ['t' => 'note', 'label' => $label];
    }

    private static function check(string $label, bool $on): array
    {
        return ['t' => 'check', 'label' => $label, 'on' => $on];
    }

    private static function legal(string $label): array
    {
        return ['t' => 'legal', 'label' => $label];
    }

    /** Plain scalar value for a key, formatted; '' when empty. */
    private static function v(array $in, string $key): string
    {
        $raw = $in[$key] ?? null;
        if ($raw === null || $raw === '' || is_array($raw)) {
            return is_array($raw) ? self::pick($raw, []) : '';
        }
        if (is_bool($raw)) {
            return $raw ? 'Yes' : 'No';
        }

        return (string) $raw;
    }

    private static function date(array $in, string $key): string
    {
        $raw = $in[$key] ?? null;
        if ($raw === null || $raw === '') {
            return '';
        }
        try {
            return Carbon::parse($raw)->format('d/m/Y');
        } catch (\Throwable $e) {
            return (string) $raw;
        }
    }

    private static function bool(array $in, string $key): string
    {
        if (! array_key_exists($key, $in) || $in[$key] === null || $in[$key] === '') {
            return '';
        }

        return self::truthy($in[$key]) ? 'Yes' : 'No';
    }

    private static function truthy($v): bool
    {
        if (is_bool($v)) {
            return $v;
        }
        if (is_numeric($v)) {
            return (int) $v === 1;
        }

        return in_array(strtolower(trim((string) $v)), ['yes', 'y', 'true', '1'], true);
    }

    /** Decode a possibly-json array field into a list of associative rows. */
    private static function listOf(array $in, string $key): array
    {
        $raw = $in[$key] ?? null;
        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            $raw = is_array($decoded) ? $decoded : null;
        }
        if (! is_array($raw) || $raw === []) {
            return [];
        }
        // A single assoc object → wrap as one entry.
        if (array_keys($raw) !== range(0, count($raw) - 1)) {
            return [$raw];
        }

        return array_values(array_filter($raw, 'is_array'));
    }

    /** First non-empty value among candidate keys of an entry (formats dates/bools). */
    private static function pick(array $entry, array $keys): string
    {
        foreach ($keys as $k) {
            if (! array_key_exists($k, $entry)) {
                continue;
            }
            $v = $entry[$k];
            if ($v === null || $v === '' || $v === []) {
                continue;
            }
            if (is_bool($v)) {
                return $v ? 'Yes' : 'No';
            }
            if (is_array($v)) {
                return implode(', ', array_map(fn ($x) => is_scalar($x) ? (string) $x : json_encode($x), $v));
            }

            return (string) $v;
        }

        return '';
    }
}
