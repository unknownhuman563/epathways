<?php

namespace Database\Seeders;

use App\Models\AgreementTemplate;
use Illuminate\Database\Seeder;

/**
 * Build 11.D Phase 2 — Seed two starter templates so consultants have
 * something usable on day one. Idempotent via updateOrCreate on (name).
 *
 * Real production content for these templates will be edited by admins
 * via Build 11.F's template-management UI (out of scope for 11.D).
 */
class AgreementTemplateSeeder extends Seeder
{
    public function run(): void
    {
        AgreementTemplate::updateOrCreate(
            ['name' => 'Generic Consultancy Agreement'],
            [
                'visa_type'          => null,
                'is_active'          => true,
                'required_variables' => ['total_fee', 'payment_terms'],
                'body'               => $this->genericBody(),
            ],
        );

        AgreementTemplate::updateOrCreate(
            ['name' => 'Skilled Migrant Resident Visa Agreement'],
            [
                'visa_type'          => 'Skilled Migrant Category',
                'is_active'          => true,
                'required_variables' => ['total_fee', 'payment_terms', 'application_scope'],
                'body'               => $this->smcBody(),
            ],
        );
    }

    private function genericBody(): string
    {
        return <<<TXT
CONSULTANCY AGREEMENT

This agreement is between {{client_name}} ("the Client") and {{consultancy_name}} ("the Consultant"), dated {{agreement_date}}.

1. SCOPE OF SERVICES
The Consultant will provide immigration consultancy services for the Client's {{visa_type}} application. Specific deliverables, milestones, and timelines will be agreed in writing.

2. FEES
Total professional fee: {{total_fee}}
Payment terms: {{payment_terms}}

The fee covers professional services only. Disbursements (INZ application fees, translations, medical examinations, courier costs, etc.) are billed separately at cost.

3. CLIENT RESPONSIBILITIES
The Client agrees to:
  (a) Provide accurate, complete, and truthful information.
  (b) Supply required documents in a timely manner.
  (c) Notify the Consultant of any change in circumstances that may affect the application.

4. CONSULTANT RESPONSIBILITIES
The Consultant agrees to:
  (a) Act in the Client's best interests within applicable laws and the IAA Code of Conduct.
  (b) Maintain the confidentiality of the Client's information.
  (c) Provide clear, regular updates on application progress.

5. TERMINATION
Either party may terminate this agreement in writing. The Client remains liable for fees and disbursements incurred up to the termination date.

6. ACCEPTANCE
By signing below, the Client confirms they have read, understood, and agreed to the terms of this agreement.

Signed by Client: ___________________  Date: ___________
({{client_name}})

Consultant: {{consultant_name}}
{{consultancy_name}}
TXT;
    }

    private function smcBody(): string
    {
        return <<<TXT
SKILLED MIGRANT CATEGORY (RESIDENT VISA) AGREEMENT

This agreement is between {{client_name}} ("the Applicant") and {{consultancy_name}} ("the Consultant"), dated {{agreement_date}}.

1. SCOPE
The Consultant will represent the Applicant in their Skilled Migrant Category Resident Visa application. Scope: {{application_scope}}.

2. PROFESSIONAL FEE
Total: {{total_fee}}
Payment terms: {{payment_terms}}

Fee covers EOI submission, ITA response (if invited), and the full residence application through to decision. It does NOT include partner / dependent applications, family-stream variations, or appeals — those are quoted separately.

3. DISBURSEMENTS (billed at cost)
INZ application fee · Medical exams · Police certificates · Translations · Courier / e-Medical handling.

4. DOCUMENTATION REQUIREMENTS
The Applicant agrees to provide documents per the Consultant's checklist within agreed timelines. Delays caused by missing documents may extend processing.

5. CONFIDENTIALITY & PRIVACY
The Consultant will handle the Applicant's personal information in accordance with the Privacy Act 2020 and the IAA Code of Conduct.

6. TERMINATION
Either party may terminate in writing. The Applicant remains liable for work completed and disbursements incurred to the termination date.

7. ACCEPTANCE
The Applicant confirms they have read, understood, and agreed to this agreement.

Signed by Applicant: ___________________  Date: ___________
({{client_name}})

Consultant: {{consultant_name}}
{{consultancy_name}}
TXT;
    }
}
