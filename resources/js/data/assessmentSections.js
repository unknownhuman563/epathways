// Per-visa-type assessment section layout for the Case Profile "Personal" tab —
// mirrors the server schema used by the Visa Assessment "Open" modal
// (ImmigrationController::intakeSectionSchema) so the case view reads the same
// sections, in the same order, as the assessment review. Name/email/phone live
// in the editable Personal form above, so they're intentionally omitted here.

export const ASSESSMENT_SECTIONS = {
    resident: [
        { title: "Personal Details", fields: [
            ["dob", "Date of Birth"], ["nationality", "Nationality"],
        ] },
        { title: "Passport & Visa", fields: [
            ["passport_number", "Passport Number"], ["passport_expiry", "Passport Expiry"],
            ["issuing_country", "Passport Issuing Country"], ["current_visa_type", "Current NZ Visa Type"],
            ["current_visa_other", "Visa Type (Other)"], ["current_visa_expiry", "Current Visa Expiry"],
            ["nz_arrival_date", "NZ Arrival Date"], ["previous_nz_visa_history", "Previous NZ Visa History"],
        ] },
        { title: "Employment", fields: [
            ["job_title", "Job Title"], ["employment_start", "Employment Start Date"],
            ["employment_type", "Employment Type"], ["hourly_rate", "Hourly Rate (NZD)"],
        ] },
        { title: "Qualifications", fields: [
            ["highest_qualification", "Highest Qualification"], ["institution_name", "Institution Name"],
            ["country_of_study", "Country of Study"], ["nzqa_status", "NZQA (IQA) Assessment Status"],
            ["nzqa_iqa_reference", "NZQA IQA Reference"],
        ] },
        { title: "Work Experience", fields: [
            ["nz_skilled_years", "Years of NZ Skilled Work"], ["total_skilled_years", "Total Years Skilled Work"],
            ["career_summary", "Career Summary"],
        ] },
        { title: "English & Family", fields: [
            ["english_evidence", "English Language Evidence"], ["english_test_score", "English Test Score / Band"],
            ["english_test_date", "English Test Date"], ["include_family", "Family Members to Include"],
            ["family_members", "Family Members"],
        ] },
        { title: "Additional Information", fields: [
            ["character_health_disclosure", "Character / Health Matters to Disclose"], ["other_notes", "Other Notes for Adviser"],
        ] },
    ],
    work: [
        { title: "Identity", fields: [
            ["other_names", "Other Names Used"], ["gender", "Gender"], ["dob", "Date of Birth"],
            ["country_of_birth", "Country of Birth"], ["place_of_birth", "Place of Birth"],
            ["country_of_citizenship", "Country of Citizenship"], ["other_citizenships", "Other Citizenships"],
            ["national_id", "National ID"], ["partnership_status", "Partnership Status"],
            ["current_address", "Current Physical Address"],
        ] },
        { title: "NZ Immigration History", fields: [
            ["current_country", "Country When Application is Submitted"], ["previous_nz_visa", "Previously Applied for a NZ Visa"],
            ["previous_nz_visa_details", "Previous NZ Visa Details"], ["previous_nzeta", "Previously Requested an NZeTA"],
            ["australian_pr", "Holds Australian PR Visa"], ["travelled_nz", "Ever Travelled to NZ"],
            ["last_nz_departure", "Last Departure from NZ"], ["over_24_months", "Total NZ Time 24 Months or More"],
        ] },
        { title: "NZ Employer", fields: [
            ["employer_name", "Employer Name"], ["employer_is_family", "Employer is a Family Member"],
            ["employer_family_relation", "Relationship to Employer"], ["self_employed", "Will be Self-Employed"],
            ["job_start_date", "Job Start Date"], ["hourly_rate", "Hourly Rate (NZD)"],
            ["supports_dependent_children", "Supports Dependent Children"],
        ] },
        { title: "Character", fields: [
            ["character_convicted", "Convicted of an Offence"], ["character_investigation", "Under Investigation / Facing Charges"],
            ["character_deported", "Expelled / Deported / Refused Entry"], ["character_visa_refused", "Refused a Visa by Any Country"],
            ["lived_other_country_5y", "Lived in Another Country 5+ Years"], ["lived_other_country_details", "Country and Years"],
        ] },
        { title: "Health", fields: [
            ["health_tb", "Tuberculosis"], ["health_renal", "Receiving Renal Dialysis"],
            ["health_hospital", "Receiving Hospital Care"], ["health_residential", "Receiving Residential Care"],
            ["health_pregnant", "Pregnant"],
        ] },
        { title: "Current Employment", fields: [
            ["currently_working", "Currently Working"], ["current_job_title", "Job Title"],
            ["current_job_start", "Employment Start Date"], ["current_job_country", "Country of Work"],
            ["current_job_region", "Region of Work"], ["current_employer_name", "Organisation Name"],
            ["current_employer_phone", "Employer Phone"], ["current_employer_email", "Employer Email"],
            ["current_job_duties", "Detailed Job Duties"], ["current_employer_address", "Employer Address"],
        ] },
        { title: "Military & Travel", fields: [
            ["military_compulsory", "Military Service Was Compulsory"], ["military_undertaken", "Ever Undertaken Military Service"],
            ["military_details", "Military Service Details"], ["travelled_internationally", "Ever Travelled Internationally"],
        ] },
        { title: "Declaration", fields: [
            ["declaration_accepted", "Declaration Accepted"], ["signature_name", "Applicant Name (Printed)"], ["signature_date", "Date Signed"],
        ] },
    ],
    student: [
        { title: "Identity", fields: [
            ["other_names", "Other Names Used"], ["gender", "Gender"], ["dob", "Date of Birth"],
            ["country_of_birth", "Country of Birth"], ["place_of_birth", "Place of Birth"],
            ["country_of_citizenship", "Country of Citizenship"], ["other_citizenships", "Other Citizenships"],
            ["national_id", "National ID"], ["passport_number", "Passport Number"], ["passport_expiry", "Passport Expiry"],
            ["partnership_status", "Partnership Status"], ["current_address", "Current Physical Address"],
            ["overseas_address", "Most Recent Overseas Address"],
        ] },
        { title: "NZ Immigration History", fields: [
            ["current_country", "Country When Application is Submitted"], ["travelled_nz", "Ever Travelled to NZ"],
            ["last_nz_departure", "Last Departure from NZ"], ["over_24_months", "Total NZ Time 24 Months or More"],
        ] },
        { title: "Character", fields: [
            ["character_convicted", "Convicted of an Offence"], ["character_investigation", "Under Investigation / Facing Charges"],
            ["character_deported", "Expelled / Deported / Refused Entry"], ["character_visa_refused", "Refused a Visa by Any Country"],
            ["lived_other_country_5y", "Lived in Another Country 5+ Years"], ["lived_other_country_details", "Country and Years"],
        ] },
        { title: "Health", fields: [
            ["health_tb", "Tuberculosis"], ["health_renal", "Receiving Renal Dialysis"],
            ["health_hospital", "Receiving Hospital Care"], ["health_residential", "Receiving Residential Care"],
            ["health_pregnant", "Pregnant"],
        ] },
        { title: "Current Employment", fields: [
            ["currently_working", "Currently Working"], ["current_job_title", "Job Title"],
            ["current_job_start", "Employment Start Date"], ["current_job_finish", "Employment Finish Date"],
            ["current_job_country", "Country of Work"], ["current_job_region", "Region of Work"],
            ["current_employer_name", "Organisation Name"], ["current_employer_phone", "Employer Phone"],
            ["current_employer_email", "Employer Email"], ["current_job_duties", "Detailed Job Duties"],
            ["current_employer_address", "Employer Address"],
        ] },
        { title: "Study Plan", fields: [
            ["programmes", "Programme(s) to Study"], ["study_period_from", "Intended Study From"],
            ["study_period_to", "Intended Study To"], ["school_name", "School / Institution"], ["has_offer", "Has an Offer of Place"],
        ] },
        { title: "Study Funds & Assets", fields: [
            ["has_enough_funds", "Has Enough Funds"], ["tuition_fee_nzd", "Tuition Fee (NZD)"],
            ["living_expenses_nzd", "Living Expenses (NZD)"], ["has_sponsor", "Has a Sponsor"],
            ["sponsor_relationship", "Relationship to Sponsor"], ["sponsor_income_source", "Sponsor's Source of Income"],
            ["can_provide_statements", "Can Provide 6 Months Bank Statements"], ["has_other_assets", "Has Other Assets"],
            ["other_assets_details", "Assets — Type and Value"],
        ] },
        { title: "Declaration", fields: [
            ["declaration_accepted", "Declaration Accepted"], ["signature_name", "Applicant Name (Printed)"], ["signature_date", "Date Signed"],
        ] },
    ],
    visitor: [
        { title: "Identity", fields: [
            ["other_names", "Other Names Used"], ["gender", "Gender"], ["dob", "Date of Birth"],
            ["country_of_birth", "Country of Birth"], ["place_of_birth", "Place of Birth"],
            ["country_of_citizenship", "Country of Citizenship"], ["passport_number", "Passport Number"],
            ["passport_expiry", "Passport Expiry"], ["other_citizenships", "Other Citizenships"],
            ["national_id", "National ID"], ["partnership_status", "Partnership Status"],
            ["current_address", "Current Physical Address"], ["town_city", "Town / City"],
            ["region", "Region"], ["postcode", "Post Code"],
        ] },
        { title: "NZ Immigration History", fields: [
            ["current_country", "Country When Application is Submitted"], ["previous_nz_visa", "Previously Applied for a NZ Visa"],
            ["previous_nzeta", "Previously Requested an NZeTA"], ["australian_pr", "Holds Australian PR Visa"],
            ["travelled_nz", "Ever Travelled to NZ"], ["last_nz_departure", "Last Departure from NZ"],
            ["over_24_months", "Total NZ Time 24 Months or More"],
        ] },
        { title: "Character", fields: [
            ["character_convicted", "Convicted of an Offence"], ["character_deported", "Expelled / Deported / Refused Entry"],
            ["character_investigation", "Under Investigation / Facing Charges"], ["character_visa_refused", "Refused a Visa by Any Country"],
            ["lived_other_country_5y", "Lived in Another Country 5+ Years"], ["previous_police_certificate", "Previously Provided Police Certificate"],
        ] },
        { title: "Health", fields: [
            ["health_tb", "Tuberculosis"], ["health_renal", "Receiving Renal Dialysis"],
            ["health_hospital", "Receiving Hospital Care"], ["health_residential", "Receiving Residential Care"],
            ["health_pregnant", "Pregnant"], ["previous_xray", "Previously Provided Chest X-ray"],
            ["previous_inz1007", "Previously Provided General Medical (INZ 1007)"], ["inz_requested_medical", "INZ Requested Medical Info Last Time"],
        ] },
        { title: "Education", fields: [
            ["has_tertiary", "Any Tertiary Education"], ["qualification_duration", "Duration of Study"],
            ["qualification_name", "Qualification and Major"], ["qualification_completed", "Qualification Completed"],
            ["education_provider", "Education Provider"],
        ] },
        { title: "Current Employment", fields: [
            ["currently_working", "Currently Working"], ["current_job_title", "Job Title"],
            ["current_job_start", "Employment Start Date"], ["current_job_finish", "Employment Finish Date"],
            ["current_job_country", "Country of Work"], ["current_job_region", "Region of Work"],
            ["current_employer_name", "Organisation Name"], ["current_employer_phone", "Employer Phone"],
            ["current_employer_email", "Employer Email"], ["current_job_duties", "Detailed Job Duties"],
            ["current_employer_address", "Employer Address"],
        ] },
        { title: "Travel Plan", fields: [
            ["purpose_of_visit", "Purpose of Visit"], ["intended_stay_length", "Intended Length of Stay"],
            ["intended_from", "Intended Arrival"], ["intended_to", "Intended Departure"],
            ["has_leave_permit", "Has a Leave Permit"], ["multi_entry_plans", "Multi-Entry Plans"],
        ] },
        { title: "Travel Funds", fields: [
            ["travel_funds_description", "Travel Funds"], ["can_provide_statements", "Can Provide 6 Months Bank Statements"],
            ["has_other_assets", "Has Other Assets"], ["other_assets_details", "Assets — Type and Value"],
        ] },
        { title: "Declaration", fields: [
            ["declaration_accepted", "Declaration Accepted"], ["signature_name", "Applicant Name (Printed)"], ["signature_date", "Date Signed"],
        ] },
    ],
    family: [
        { title: "Identity", fields: [
            ["other_names", "Other Names Used"], ["gender", "Gender"], ["dob", "Date of Birth"],
            ["partnership_status", "Partnership Status"], ["country_of_birth", "Country of Birth"],
            ["place_of_birth", "Place of Birth"], ["country_of_citizenship", "Country of Citizenship"],
            ["other_citizenships", "Other Citizenships"], ["national_id", "National ID"],
        ] },
        { title: "NZ Immigration", fields: [
            ["current_country", "Country When Application is Submitted"], ["previous_nz_visa", "Previously Applied for a NZ Visa"],
            ["current_address", "Current Physical Address"],
        ] },
        { title: "Visa Details", fields: [
            ["applying_as", "Applying As"], ["visa_type", "Visa Type Applying For"],
            ["partner_living_together", "Currently Living Together"], ["partner_12_months", "Living Together 12 Months Total"],
            ["partner_same_period", "Both in NZ Same Period"], ["partner_close_relatives", "Are Close Relatives"],
            ["child_dependent", "Child is Dependent (19 or Under)"],
        ] },
        { title: "Character", fields: [
            ["character_convicted", "Convicted of an Offence"], ["character_removed", "Removed / Deported / Refused Entry"],
            ["character_investigation", "Under Investigation / Facing Charges"], ["character_visa_refused", "Refused a Visa by Any Country"],
            ["lived_other_country_5y", "Lived in Another Country 5+ Years"], ["previous_police_certificate", "Previously Provided Police Certificate"],
        ] },
        { title: "Health", fields: [
            ["health_tb", "Tuberculosis"], ["health_renal", "Receiving Renal Dialysis"],
            ["health_hospital", "Receiving Hospital Care"], ["health_residential", "Receiving Residential Care"],
            ["health_pregnant", "Pregnant"], ["previous_xray", "Previously Provided Chest X-ray"],
            ["previous_medical_cert", "Previously Provided Medical Certificate"], ["countries_visited_3m", "Countries Visited / Lived 3+ Months"],
        ] },
        { title: "Work History", fields: [
            ["currently_working", "Currently Working"], ["current_employer_name", "Organisation Name"],
            ["current_occupation", "Occupation / Job Title"], ["current_employer_phone", "Employer Phone"],
            ["current_employer_email", "Employer Email"], ["current_start", "Start Date"],
            ["current_end", "End Date"], ["current_employer_address", "Employer Address"],
        ] },
        { title: "Contacts & Declaration", fields: [
            ["nz_contacts", "Contacts in New Zealand"], ["declaration_accepted", "Declaration Accepted"],
            ["signature_name", "Applicant Name (Printed)"], ["signature_date", "Date Signed"],
        ] },
    ],
};

// Humanise a stored intake value for read-only display (mirrors the server's
// formatIntakeValue): booleans → Yes/No, lists → comma-joined, objects → count.
export function formatAssessmentValue(v) {
    if (v === null || v === undefined || v === "") return { text: "—", provided: false };
    if (typeof v === "boolean") return { text: v ? "Yes" : "No", provided: true };
    if (Array.isArray(v)) {
        if (v.every((x) => x === null || ["string", "number", "boolean"].includes(typeof x))) {
            const joined = v.filter((x) => x !== null && x !== "").join(", ");
            return joined ? { text: joined, provided: true } : { text: "—", provided: false };
        }
        return v.length
            ? { text: `${v.length} entr${v.length === 1 ? "y" : "ies"}`, provided: true }
            : { text: "—", provided: false };
    }
    if (typeof v === "object") {
        const parts = Object.entries(v)
            .filter(([, val]) => val !== null && val !== "" && (typeof val !== "object"))
            .map(([k, val]) => `${k.replace(/_/g, " ")}: ${val}`);
        return parts.length ? { text: parts.join(", "), provided: true } : { text: "—", provided: false };
    }
    return { text: String(v), provided: true };
}
