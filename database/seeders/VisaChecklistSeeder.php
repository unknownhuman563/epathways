<?php

namespace Database\Seeders;

use App\Models\VisaType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;

/**
 * Seeds the checklist_items JSON field on each visa_type with the
 * required document list, sourced from the ePathways visa checklist
 * Word documents.
 *
 * Looks up visa_types by `code`. If a visa_type with the expected code
 * doesn't exist, logs a warning and skips. Does NOT create new visa_types.
 *
 * Idempotent — running multiple times overwrites checklist_items with
 * the same data.
 *
 * Schema used: { key, label, hint, required } per item.
 * Section grouping is embedded in the label as "Section · Item Name"
 * so staff and clients see the grouping visually without needing
 * schema-level section support.
 */
class VisaChecklistSeeder extends Seeder
{
    public function run(): void
    {
        $checklists = $this->checklists();

        foreach ($checklists as $code => $items) {
            $visaType = VisaType::where('code', $code)->first();

            if (! $visaType) {
                Log::warning("VisaChecklistSeeder: visa_type with code '{$code}' not found, skipping");
                $this->command->warn("Skipped: visa_type code '{$code}' not found");
                continue;
            }

            $visaType->checklist_items = $items;
            $visaType->save();

            $this->command->info("Seeded: {$visaType->name} ({$code}) — " . count($items) . ' items');
        }
    }

    private function item(string $key, string $section, string $label, string $hint, bool $required = true): array
    {
        return [
            'key' => $key,
            'label' => $section . ' · ' . $label,
            'hint' => $hint,
            'required' => $required,
        ];
    }

    private function checklists(): array
    {
        return [
            'WORK_AEWV' => $this->aewv(),
            'STUDENT' => $this->studentVisa(),
            'POST_STUDY_WORK' => $this->postStudyWorkVisa(),
            'PARTNER_WORK' => $this->partnershipVisa(),
            'PARTNER_RES' => $this->partnershipOfResident(),
            'STRV' => $this->straightToResident(),
            'WTRV' => $this->workToResident(),
            'PRV' => $this->permanentResidentVisa(),
            'DCRV' => $this->dependentChildResidentVisa(),
            'SVDC' => $this->studentVisaDependentChild(),
        ];
    }

    private function aewv(): array
    {
        return [
            $this->item('passport_pdf', 'Identity', 'Passport (PDF)',
                'Clear colour scan of your current, valid passport saved in PDF format.'),
            $this->item('passport_bio_page', 'Identity', 'Passport biographical page',
                'The photo/details page showing your name, date of birth, passport number and expiry date.'),
            $this->item('face_image_jpg', 'Identity', 'Face image (JPG)',
                'Recent passport-style photo – plain light background, full face, no glasses/hat – saved as a JPG file.'),

            $this->item('job_token', 'Employment', 'Job Token / Job Check copy',
                'Copy of the Job Check token issued to the employer, which links the approved role to your AEWV application.'),
            $this->item('offer_letter', 'Employment', 'Offer letter from employer',
                'Formal written job offer stating the role, pay rate, hours and key conditions.'),
            $this->item('current_aewv_copy', 'Employment', 'Current AEWV (work visa) copy',
                'Copy of your current Accredited Employer Work Visa showing its conditions and expiry date. If applicable.', false),
            $this->item('employer_accreditation', 'Employment', "Employer's active accreditation",
                "Evidence that the employer's INZ accreditation is current and active."),
            $this->item('employment_agreement', 'Employment', 'Signed employment agreement + job description',
                'Your signed employment agreement together with the position description matching the offer.'),
            $this->item('recent_payslips', 'Employment', 'Two recent payslips',
                'Your two most recent payslips as evidence of ongoing employment and pay.'),
            $this->item('cv', 'Employment', 'Updated CV',
                'Current curriculum vitae summarising your work history, roles and responsibilities.'),

            $this->item('medical_certificate', 'Health & Character', 'Updated medical / X-ray',
                'Chest X-ray and general medical certificate (generally required for stays over 12 months). A new certificate must be issued less than 3 months before you apply; you can re-use an earlier one only if it is less than 3 years old and was previously assessed as acceptable.'),
            $this->item('english_proof', 'Health & Character', 'English language proof',
                'IELTS 4.0 overall, PTE Academic 29, or an accepted equivalent (test less than 2 years old). From 1 June 2026 this requirement applies to ANZSCO/NOL skill level 3 roles too.'),
            $this->item('police_certificate', 'Health & Character', 'Police certificate (no criminal record)',
                'From 8 December 2025 a complete, valid certificate must be provided WITH your application – receipts are no longer accepted (except Fiji, Hong Kong, Israel).'),
            $this->item('ird_summary', 'Health & Character', 'IRD Summary of Earnings',
                'Inland Revenue earnings summary demonstrating at least 2 years of relevant work experience (reduced from 3 years on 10 March 2025).'),

            $this->item('inz_1225', 'Forms', 'INZ 1225 Work Visa Declaration Form',
                'Immigration NZ declaration form – complete and sign the 3 highlighted parts.'),
            $this->item('ep_service_agreement', 'Forms', 'EP service agreement',
                'Service agreement with the adviser/agency, fully completed and signed.'),
            $this->item('aewv_info_form', 'Forms', 'AEWV information form',
                'Internal AEWV information form, fully completed and signed.'),
        ];
    }

    private function studentVisa(): array
    {
        return [
            $this->item('passport_pdf', 'Identity', 'Passport (PDF)',
                'Clear colour scan of your current, valid passport in PDF format.'),
            $this->item('passport_bio_page', 'Identity', 'Passport biographical page',
                'The photo/details page showing name, date of birth, passport number and expiry date.'),
            $this->item('face_image_jpg', 'Identity', 'Face image (JPG)',
                'Portrait JPG photo: 900×1200 to 2250×3000 pixels, file size 500 KB–3 MB, plain background, full face.'),

            $this->item('offer_of_place', 'Admission', 'Offer of Place',
                'Offer of Place from your NZ institution.'),
            $this->item('transcript', 'Admission', 'Transcript of record (TOR)',
                'Official academic transcript from your previous school.'),
            $this->item('graduate_certificate', 'Admission', 'Graduate certificate',
                'Your completed qualification certificate.'),
            $this->item('pte_result', 'Admission', 'PTE result',
                "Your PTE Academic English test result (or accepted equivalent) meeting the programme's requirement."),
            $this->item('tuition_payment_evidence', 'Admission', 'Evidence of tuition fee payment',
                'Official receipt from the school confirming tuition fees paid.'),

            $this->item('bank_statements', 'Financial', 'Savings + 6-month bank statements',
                'Bank statements (last 6 months) showing funds to cover your study – e.g. NZ$30,000 for 18 months of study. Verified June 2026: NZD $20,000/year tertiary, NZD $17,000/year school years 1–13, on top of tuition and return airfare.'),
            $this->item('additional_funds', 'Financial', 'Additional source of funds',
                'Proof of any additional funds you wish to include to support the savings above. If applicable.', false),

            $this->item('travel_records', 'Background', 'Visas / travel records',
                'Copies of visas or travel records if you have been to other countries. If applicable.', false),
            $this->item('birth_certificate', 'Background', 'Birth certificate',
                'Your full birth certificate.'),
            $this->item('marriage_certificate', 'Background', 'Marriage certificate',
                'Official marriage certificate, if you are married. If applicable.', false),
            $this->item('last_employment_reference', 'Background', 'Last employment work reference',
                'Reference letter from your most recent employer. If you have been employed.', false),
            $this->item('certificate_of_employment', 'Background', 'Certificate of Employment',
                'Certificate confirming your employment history, role and dates. If you have been employed.', false),
            $this->item('cv', 'Background', 'CV',
                'Current CV summarising your education and work history.'),
            $this->item('payslips', 'Background', 'Last 3 payslips',
                'Your three most recent payslips, if you have been employed. If applicable.', false),
            $this->item('property_ownership', 'Background', 'Property ownership',
                'Evidence of any property you own (ties to home country). If applicable.', false),
            $this->item('personal_statement', 'Background', 'Personal statement',
                'A statement explaining your study plan in NZ and your plans after study.'),

            $this->item('inz_1014', 'Forms', 'Signed INZ 1014 (financial undertaking)',
                'Financial Undertaking for a Student (Sponsorship) form, completed and signed. Required only if sponsored.', false),
            $this->item('inz_1226', 'Forms', 'Signed INZ 1226 (student declaration)',
                'Student Declaration Form, completed and signed.'),
            $this->item('medical_certificate', 'Forms', 'Medical certificate (general & X-ray)',
                'General medical and chest X-ray certificate from an Immigration NZ-approved panel clinic.'),
            $this->item('police_clearance', 'Forms', 'NBI / police clearance',
                "Police clearance certificate (NBI for the Philippines, or your country's equivalent)."),

            $this->item('sponsor_bank_statement', 'Sponsor (if applicable)', "Sponsor's bank statement",
                'Recent bank statements for the sponsor showing sufficient funds. Required if sponsored.', false),
            $this->item('sponsor_letter_support', 'Sponsor (if applicable)', 'Letter of support',
                'Signed letter from the sponsor confirming they will support your study and living costs. Required if sponsored.', false),
            $this->item('sponsor_photos', 'Sponsor (if applicable)', 'Photos with sponsor',
                'Photos of you together with the sponsor, evidencing the relationship. Required if sponsored.', false),
            $this->item('sponsor_passport', 'Sponsor (if applicable)', "Sponsor's passport",
                "Copy of the sponsor's passport or photo ID. Required if sponsored.", false),
            $this->item('sponsor_birth_certificate', 'Sponsor (if applicable)', "Sponsor's birth certificate",
                "Sponsor's birth certificate, to help establish the relationship. Required if sponsored.", false),
            $this->item('sponsor_business_permit', 'Sponsor (if applicable)', 'Business permit',
                "Sponsor's business permit, if they are self-employed/own a business. If applicable.", false),
            $this->item('sponsor_payslips', 'Sponsor (if applicable)', "Sponsor's payslips",
                "Sponsor's recent payslips, if employed. If applicable.", false),
            $this->item('sponsor_coe', 'Sponsor (if applicable)', "Sponsor's Certificate of Employment",
                "Certificate confirming the sponsor's employment, role and income. If applicable.", false),
            $this->item('sponsor_relationship_docs', 'Sponsor (if applicable)', 'Relationship / citizenship certificates',
                'Government-issued documents linking you to the sponsor. Required if sponsored.', false),
        ];
    }

    private function postStudyWorkVisa(): array
    {
        return [
            $this->item('passport_pdf', 'Identity', 'Passport (PDF)',
                'Clear colour scan of your current, valid passport in PDF format.'),
            $this->item('passport_bio_page', 'Identity', 'Passport biographical page',
                'The photo/details page showing name, date of birth, passport number and expiry date.'),
            $this->item('face_image_jpg', 'Identity', 'Face image (JPG)',
                'Portrait JPG photo: 900×1200 to 2250×3000 pixels, file size 500 KB–3 MB, plain background, full face.'),

            $this->item('letter_of_eligibility', 'Study & Qualifications', 'Letter of Eligibility',
                'Letter confirming you are eligible for the post-study work visa based on your qualification.'),
            $this->item('degree', 'Study & Qualifications', 'Degree / Graduate Certificate',
                'Your completed NZ qualification certificate (degree or graduate certificate).'),
            $this->item('transcript', 'Study & Qualifications', 'Academic records / Transcript (TOR)',
                'Official transcript of records / academic results from your NZ programme.'),
            $this->item('student_visa_copy', 'Study & Qualifications', 'Student visa copy',
                'Copy of the student visa you held while completing the qualification.'),
            $this->item('attendance_report', 'Study & Qualifications', 'Attendance report (NZ school)',
                'Attendance record from your NZ education provider.'),

            $this->item('bank_statement', 'Financial', 'Bank statement (min NZD 5,000)',
                'Recent bank statement (ideally last 6 months) showing at least NZD 5,000 in funds.'),

            $this->item('medical_certificate', 'Health & Character', 'Medical certificate (general & X-ray)',
                'General medical and chest X-ray certificate from an Immigration NZ-approved panel clinic.'),
            $this->item('police_clearance', 'Health & Character', 'NBI / PCC clearance',
                "Police clearance certificate. Required if you are 17 or older and have been in NZ for 24 months or longer."),

            $this->item('birth_certificate', 'Supporting Documents', 'Birth certificate',
                'Your full birth certificate.'),
            $this->item('travel_records', 'Supporting Documents', 'Visas / travel records',
                'Copies of visas or travel records if you have been to other countries. If applicable.', false),
            $this->item('tenancy_contract', 'Supporting Documents', 'Tenancy contract',
                'Your current tenancy agreement or proof of NZ address.'),
            $this->item('marriage_certificate', 'Supporting Documents', 'Marriage certificate',
                'Official marriage certificate, if you are married. If applicable.', false),

            $this->item('inz_1225', 'Forms', 'INZ 1225 Work Visa Declaration Form (signed)',
                'Immigration NZ work visa declaration form, completed and signed.'),
        ];
    }

    private function partnershipVisa(): array
    {
        return [
            $this->item('passport_pdf', 'Identity', 'Passport (PDF)',
                'Clear colour scan of your current, valid passport in PDF format.'),
            $this->item('passport_bio_page', 'Identity', 'Passport biographical page',
                'The photo/details page showing name, date of birth, passport number and expiry date.'),
            $this->item('face_image_jpg', 'Identity', 'Face image (JPG)',
                'Recent passport-style photo – plain light background, full face – saved as a JPG file.'),

            $this->item('medical_certificate', 'Health & Character', 'E-medicals (X-ray & general medical)',
                'Completed at an Immigration NZ-approved panel clinic. Required if your previous medical has expired (over 3 years old) or was never provided.'),
            $this->item('police_clearance', 'Health & Character', 'Police / NBI clearance',
                "A recent police/character certificate (NBI clearance for the Philippines)."),

            $this->item('inz_1241', 'Forms & Sponsorship', 'Signed INZ 1241 declaration form',
                'Partnership declaration form completed and signed by the applicant partner.'),
            $this->item('inz_1146', 'Forms & Sponsorship', 'Signed INZ 1146 partner supporting form',
                'Supporting partnership form completed and signed by the supporting/sponsoring partner.'),
            $this->item('family_visa_info_form', 'Forms & Sponsorship', 'Family Visa Information Form',
                'The completed and signed Immigration NZ family/partner information form.'),
            $this->item('sponsor_visa', 'Forms & Sponsorship', "Sponsor's most recent NZ visa",
                "Copy of the supporting partner's current NZ visa, residence or citizenship status."),

            $this->item('marriage_certificate', 'Partnership Evidence', 'Marriage certificate',
                'Official marriage or civil union certificate, if you are married. If applicable.', false),
            $this->item('children_birth_certificate', 'Partnership Evidence', "Children's birth certificate",
                'Birth certificate of any child you share, naming both partners as parents. If applicable.', false),
            $this->item('relationship_timeline', 'Partnership Evidence', 'Relationship timeline / love story',
                'A written account of how the relationship began and developed, with key dates.'),
            $this->item('supporting_letters', 'Partnership Evidence', 'Supporting letters from parents & friends',
                "Signed letters confirming the relationship, each with the writer's name and contact details."),
            $this->item('financial_interdependence', 'Partnership Evidence', 'Financial interdependence',
                'Bank statements showing money transfers between the two of you, shared accounts or shared expenses.'),
            $this->item('call_logs', 'Partnership Evidence', 'Call logs',
                'Records of phone calls between the couple, especially during any time apart. If applicable.', false),
            $this->item('communication_records', 'Partnership Evidence', 'Communication records',
                'Message history across platforms (WhatsApp, Skype, Viber, email, etc.) showing ongoing contact.'),
            $this->item('couple_photos', 'Partnership Evidence', 'Couple photos (6–8)',
                'A selection of photos together with family, friends, classmates and colleagues over time.'),
            $this->item('joint_assets_docs', 'Partnership Evidence', 'Joint assets documents',
                'Documents for any assets you own together. If applicable.', false),
            $this->item('joint_assets_names', 'Partnership Evidence', 'Assets in joint names',
                'Evidence of shared assets – vehicle, house, financial investments or insurance in both names. If applicable.', false),
            $this->item('travel_together', 'Partnership Evidence', 'Evidence of travelling together',
                'Shared room bookings, flight/transport tickets or itineraries. If applicable.', false),
            $this->item('gifts_cards', 'Partnership Evidence', 'Photos of gifts & cards',
                'Photos of gifts, birthday or anniversary cards exchanged between you. If applicable.', false),
            $this->item('shared_address_bills', 'Partnership Evidence', 'Bills & mail to the same address',
                'Utility bills, bank statements or dated online purchases addressed to each of you at the shared address.'),
            $this->item('house_tenancy', 'Partnership Evidence', 'House ownership or tenancy agreement',
                'Proof of your shared home – ownership/title document or a current tenancy agreement.'),
        ];
    }

    private function partnershipOfResident(): array
    {
        return [
            $this->item('passport_pdf', 'Identity', 'Passport (PDF)',
                'Clear colour scan of your current, valid passport in PDF format.'),
            $this->item('passport_bio_page', 'Identity', 'Passport biographical page',
                'The photo/details page showing name, date of birth, passport number and expiry date.'),
            $this->item('face_image_jpg', 'Identity', 'Face image (JPG)',
                'Recent passport-style photo – plain light background, full face – saved as a JPG file.'),

            $this->item('medical_certificate', 'Health, Character & Sponsorship', 'E-medicals (X-ray & general medical)',
                'For residence it must be issued less than 3 months before lodging. Required if your previous medical has expired (over 3 years old) or was never provided.'),
            $this->item('police_clearance', 'Health, Character & Sponsorship', 'Police clearance',
                'A recent police/character certificate from each country you have lived in long-term. From 8 December 2025 a complete certificate is required — receipts no longer accepted (except Fiji, Hong Kong, Israel).'),
            $this->item('family_visa_info_form', 'Health, Character & Sponsorship', 'Family Visa Information Form',
                'The family/partner information form, completed and signed by the supporting (resident) partner.'),
            $this->item('sponsor_visa', 'Health, Character & Sponsorship', "Sponsor's most recent NZ visa",
                "Copy of the supporting partner's current NZ resident visa or citizenship evidence."),

            $this->item('marriage_certificate', 'Partnership Evidence', 'Marriage certificate',
                'Official marriage or civil union certificate, if you are married. If applicable.', false),
            $this->item('children_birth_certificate', 'Partnership Evidence', "Children's birth certificate",
                'Birth certificate of any child you share. If applicable.', false),
            $this->item('relationship_timeline', 'Partnership Evidence', 'Relationship timeline / love story',
                'A written account of how the relationship began and developed, with key dates.'),
            $this->item('supporting_letters', 'Partnership Evidence', 'Supporting letters from parents & friends',
                "Signed letters confirming the relationship, each with the writer's name and contact details."),
            $this->item('financial_interdependence', 'Partnership Evidence', 'Financial interdependence',
                'Bank statements showing money transfers between the two of you, shared accounts or shared expenses.'),
            $this->item('call_logs', 'Partnership Evidence', 'Call logs',
                'Records of phone calls between the couple. If applicable.', false),
            $this->item('communication_records', 'Partnership Evidence', 'Communication records',
                'Message history showing ongoing contact.'),
            $this->item('couple_photos', 'Partnership Evidence', 'Couple photos (6–8)',
                'A selection of photos together over time.'),
            $this->item('joint_assets_docs', 'Partnership Evidence', 'Joint assets documents',
                'Documents for any assets you own together. If applicable.', false),
            $this->item('joint_assets_names', 'Partnership Evidence', 'Assets in joint names',
                'Vehicle, house, financial investments or insurance in both names. If applicable.', false),
            $this->item('travel_together', 'Partnership Evidence', 'Evidence of travelling together',
                'Shared room bookings, flight/transport tickets or itineraries. If applicable.', false),
            $this->item('gifts_cards', 'Partnership Evidence', 'Photos of gifts & cards',
                'Photos of gifts and cards exchanged. If applicable.', false),
            $this->item('shared_address_bills', 'Partnership Evidence', 'Bills & mail to the same address',
                'Utility bills, bank statements or dated mail addressed to each of you at the shared address.'),
            $this->item('house_tenancy', 'Partnership Evidence', 'House ownership or tenancy agreement',
                'Proof of your shared home – ownership/title document or a current tenancy agreement.'),
        ];
    }

    private function straightToResident(): array
    {
        return [
            $this->item('passport_pdf', 'Identity', 'Passport (PDF)',
                'Clear colour scan of your current, valid passport in PDF format.'),
            $this->item('passport_bio_page', 'Identity', 'Passport biographical page',
                'The photo/details page showing name, date of birth, passport number and expiry date.'),
            $this->item('face_image_jpg', 'Identity', 'Face image (JPG)',
                'Recent passport-style photo – plain light background, full face.'),
            $this->item('current_visa', 'Identity', 'Current visa copy',
                'Copy of your current NZ visa, if you hold one. If applicable.', false),

            $this->item('graduate_certificate', 'Qualifications', 'Graduate certificate',
                'Your completed qualification certificate.'),
            $this->item('transcript', 'Qualifications', 'Transcript of record (TOR)',
                'Official academic transcript of your results.'),
            $this->item('nzqa_assessment', 'Qualifications', 'NZQA assessment',
                'NZQA International Qualifications Assessment of your overseas qualification, if required. If applicable.', false),
            $this->item('nz_registration', 'Qualifications', 'NZ registration of professional degree',
                'Evidence of NZ professional registration for your occupation, if applicable. If applicable.', false),
            $this->item('cv', 'Qualifications', 'Updated CV',
                'Current CV summarising your work history and responsibilities.'),

            $this->item('offer_letter', 'Employment', 'Offer letter from employer',
                'Formal written job offer stating the role, pay and conditions.'),
            $this->item('employment_agreement', 'Employment', 'Signed employment agreement + job description',
                'Your signed employment agreement with the matching position description.'),
            $this->item('coe', 'Employment', 'Certificate of Employment (COE)',
                'Certificate from your employer confirming your role, tenure and duties.'),
            $this->item('payslips', 'Employment', 'Payslips',
                'Recent payslips evidencing your employment and pay.'),
            $this->item('ird_summary', 'Employment', 'IRD Summary of Earnings',
                'Inland Revenue earnings summary supporting your work history.'),

            $this->item('pte', 'English & Health', 'PTE Academic (58 average)',
                'English test result – PTE Academic with an average total band of 58 (or accepted equivalent). Verified June 2026.'),
            $this->item('medical_certificate', 'English & Health', 'Updated medical (X-ray & general)',
                'General medical and chest X-ray. For residence it must be issued less than 3 months before lodging.'),
            $this->item('police_clearance', 'English & Health', 'NBI certificate / PCC',
                "Police clearance certificate. From 8 December 2025 complete certificate required, not receipts."),

            $this->item('inz_1242', 'Forms', 'Signed INZ 1242',
                'Immigration NZ residence declaration form, completed and signed.'),
            $this->item('ep_service_agreement', 'Forms', 'EP service agreement',
                'Service agreement with the adviser/agency, completed and signed.'),
            $this->item('info_form', 'Forms', 'Information form',
                'Internal information form, completed and signed.'),
        ];
    }

    private function workToResident(): array
    {
        return [
            $this->item('passport_pdf', 'Identity', 'Passport (PDF)',
                'Clear colour scan of your current, valid passport in PDF format.'),
            $this->item('passport_bio_page', 'Identity', 'Passport biographical page',
                'The photo/details page showing name, date of birth, passport number and expiry date.'),
            $this->item('face_image_jpg', 'Identity', 'Face image (JPG)',
                'Recent passport-style photo – plain light background, full face.'),
            $this->item('current_work_visa', 'Identity', 'Copy of current work visa',
                'Copy of your current NZ work visa, if you hold one. If applicable.', false),

            $this->item('current_payslip', 'Employment', 'Current payslip',
                'Your most recent payslip evidencing ongoing employment and pay.'),
            $this->item('offer_letter', 'Employment', 'Offer letter from employer',
                'Formal written job offer stating the role, pay and conditions.'),
            $this->item('employment_agreement', 'Employment', 'Signed employment agreement + job description',
                'Your signed employment agreement with the matching position description.'),
            $this->item('coe', 'Employment', 'Certificate of Employment (COE)',
                'Certificate from your employer confirming your role, tenure and duties.'),
            $this->item('cv', 'Employment', 'Updated CV',
                'Current CV summarising your work history and responsibilities.'),
            $this->item('ird_summary_2yr', 'Employment', 'IRD Summary of Earnings (2 years)',
                'Inland Revenue earnings summary evidencing at least 2 years of relevant work experience.'),

            $this->item('nzqa_assessment', 'Qualifications', 'NZQA assessment',
                'NZQA International Qualifications Assessment of your overseas qualification, if required. If applicable.', false),
            $this->item('nz_registration', 'Qualifications', 'NZ registration of professional degree',
                'Evidence of NZ professional registration for your occupation, if applicable. If applicable.', false),

            $this->item('pte', 'English & Health', 'PTE Academic (58 average)',
                'English test result – PTE Academic 58 average or accepted equivalent. Verified June 2026.'),
            $this->item('medical_certificate', 'English & Health', 'Updated medical (X-ray & general)',
                'General medical and chest X-ray. For residence it must be issued less than 3 months before lodging.'),
            $this->item('police_clearance', 'English & Health', 'PCC / NBI certificate',
                "Police clearance certificate. From 8 December 2025 complete certificate required."),

            $this->item('inz_1242', 'Forms', 'Signed INZ 1242',
                'Immigration NZ residence declaration form, completed and signed.'),
            $this->item('ep_service_agreement', 'Forms', 'EP service agreement',
                'Service agreement with the adviser/agency, completed and signed.'),
            $this->item('info_form', 'Forms', 'Information form',
                'Internal information form, completed and signed.'),
        ];
    }

    private function permanentResidentVisa(): array
    {
        return [
            $this->item('passport_pdf', 'Identity & Forms', 'Passport (PDF)',
                'Clear colour scan of your current, valid passport in PDF format.'),
            $this->item('passport_bio_page', 'Identity & Forms', 'Passport biographical page',
                'The photo/details page showing name, date of birth, passport number and expiry date.'),
            $this->item('face_image_jpg', 'Identity & Forms', 'Face image (JPG)',
                'Recent passport-style photo – plain light background, full face.'),
            $this->item('resident_visa_copy', 'Identity & Forms', 'Copy of resident visa',
                'Copy of your current NZ resident visa.'),
            $this->item('inz_1242', 'Identity & Forms', 'Signed INZ 1242 declaration form',
                'Two parts require signature: husband (yellow highlight), wife (blue highlight).'),
            $this->item('family_visa_info_form', 'Identity & Forms', 'Family Visa Information Form',
                'The completed and signed Immigration NZ family information form.'),

            $this->item('shared_address_bills', 'Proof of Living', 'Bills & mail to the same address',
                'Utility bills, bank statements or dated online purchases showing your name at your current address.'),
            $this->item('house_tenancy', 'Proof of Living', 'House ownership or tenancy agreement',
                'Proof of your home – ownership/title document or a current tenancy agreement.'),
        ];
    }

    private function dependentChildResidentVisa(): array
    {
        return [
            $this->item('passport_pdf', 'Identity', 'Passport (PDF)',
                "Clear colour scan of the child's current, valid passport saved in PDF format."),
            $this->item('passport_bio_page', 'Identity', 'Passport biographical page',
                "The photo/details page showing the child's name, date of birth, passport number and expiry date."),
            $this->item('face_image_jpg', 'Identity', 'Face image (JPG)',
                'Recent passport-style photo – plain light background, full face, no glasses/hat – saved as a JPG file.'),

            $this->item('birth_certificate', 'Relationship & Sponsorship', 'Birth certificate',
                "Full birth certificate naming both parents, to prove the child's relationship to the sponsoring parent."),
            $this->item('sponsor_nz_visa', 'Relationship & Sponsorship', "Sponsor's most recent NZ visa",
                "Copy of the sponsoring parent's current NZ resident/citizen status or most recent NZ visa."),
            $this->item('applicant_nz_visa', 'Relationship & Sponsorship', "Applicant's current NZ visa",
                "Copy of the child's existing NZ visa, if they currently hold one. If applicable.", false),
            $this->item('family_visa_info_form', 'Relationship & Sponsorship', 'Family Visa Information Form',
                'The completed and signed Immigration NZ family/dependent information form.'),

            $this->item('medical_certificate', 'Health & Character', 'E-medicals (X-ray & general medical)',
                'Completed at an INZ-approved panel clinic. For residence it must be issued less than 3 months before lodging.'),
            $this->item('police_clearance', 'Health & Character', 'NBI / police clearance (if 18+)',
                'A recent police/character certificate, required if the applicant is 18 years or older. Required if applicable.', false),

            $this->item('shared_address_bills', 'Proof of Living', 'Bills & mail to the same address',
                "Utility bills, bank statements or dated online purchases showing the applicant's name at the shared living address."),
            $this->item('house_tenancy', 'Proof of Living', 'House ownership or tenancy agreement',
                'Proof of the home – e.g. ownership/title document or a current tenancy agreement.'),
        ];
    }

    private function studentVisaDependentChild(): array
    {
        return [
            $this->item('passport_pdf', 'Identity', 'Passport (PDF)',
                "Clear colour scan of the child's current, valid passport in PDF format."),
            $this->item('passport_bio_page', 'Identity', 'Passport biographical page',
                "The photo/details page showing the child's name, date of birth, passport number and expiry."),
            $this->item('face_image_jpg', 'Identity', 'Face image (JPG)',
                'Recent passport-style photo – plain light background, full face – saved as a JPG file.'),

            $this->item('birth_certificate', 'Relationship & Sponsorship', 'Birth certificate',
                "Full birth certificate naming both parents, to prove the child's relationship to the sponsoring parent."),
            $this->item('sponsor_sv_visa', 'Relationship & Sponsorship', "Sponsor's most recent NZ visa (SV)",
                "Copy of the sponsoring parent's current NZ Student Visa."),
            $this->item('applicant_nz_visa', 'Relationship & Sponsorship', "Applicant's current NZ visa",
                "Copy of the child's existing NZ visa, if they currently hold one. If applicable.", false),
            $this->item('family_visa_info_form', 'Relationship & Sponsorship', 'Family Visa Information Form',
                'The completed and signed Immigration NZ family/dependent information form.'),
            $this->item('inz_1241_by_parent', 'Relationship & Sponsorship', 'Signed INZ 1241 (by parent)',
                'Declaration form signed by the parent in support of the dependent child.'),

            $this->item('medical_certificate', 'Health & Character', 'E-medicals (X-ray & general medical)',
                'Completed at an Immigration NZ-approved panel clinic. Required if the previous medical has expired (over 3 years old) or was never provided.'),
            $this->item('police_clearance', 'Health & Character', 'NBI clearance (if 18+)',
                'A recent police/character certificate, required if the applicant is 18 years or older. Required if applicable.', false),

            $this->item('shared_address_bills', 'Proof of Living', 'Bills & mail to the same address',
                "Utility bills, bank statements or dated online purchases showing the applicant's name at the shared address."),
            $this->item('house_tenancy', 'Proof of Living', 'House ownership or tenancy agreement',
                'Proof of the home – ownership/title document or a current tenancy agreement.'),
        ];
    }
}
