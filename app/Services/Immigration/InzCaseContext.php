<?php

namespace App\Services\Immigration;

use App\Models\Lead;

/**
 * Flat, stable key → value context for filling INZ forms from a case. A form
 * version's field_map references these keys, so remapping on an INZ revision is
 * a data edit (change which key a PDF field points at), never code.
 *
 * Values are strings and come ONLY from the record — a blank field stays blank
 * (guardrail: no fabricated facts). No eligibility/advice content is produced.
 */
class InzCaseContext
{
    /** @return array<string, string> */
    public static function for(Lead $lead): array
    {
        $adviser = $lead->owner; // custody holder (the LIA on advice-bearing cases)

        return array_map(
            fn ($v) => $v === null ? '' : (string) $v,
            [
                // Applicant / student identity
                'applicant.family_name' => $lead->last_name,
                'applicant.first_name' => $lead->first_name,
                'applicant.middle_name' => $lead->middle_name,
                'applicant.full_name' => trim("{$lead->first_name} {$lead->last_name}"),
                'applicant.dob' => optional($lead->dob)->format('d/m/Y'),
                'applicant.gender' => $lead->gender,
                'applicant.email' => $lead->email,
                'applicant.phone' => $lead->phone,
                'applicant.nationality' => $lead->citizenship ?: $lead->residence_country,
                'applicant.residence_country' => $lead->residence_country,
                'applicant.passport_number' => $lead->passport_number,
                'applicant.passport_expiry' => optional($lead->passport_expiry)->format('d/m/Y'),
                // Case
                'case.visa_type' => $lead->inz_visa_type,
                'case.inz_reference' => $lead->inz_reference,
                'case.tracking_code' => $lead->tracking_code,
                // Adviser / firm (factual, from the record)
                'adviser.name' => optional($adviser)->name,
                'adviser.licence_number' => optional($adviser)->iaa_licence_number,
                'firm.name' => 'ePathways',
                // Convenience
                'today' => now()->format('d/m/Y'),
            ],
        );
    }
}
