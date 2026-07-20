<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\LeadDocument;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Renders agreement templates (Blade -> PDF via dompdf) and stores them
 * against a lead as a LeadDocument row with source='generated'. The UI
 * then renders that row in the relevant checklist card alongside any
 * manually-uploaded files.
 */
class AgreementGenerator
{
    private const DISK = 'local'; // private; matches LeadDocumentController's DISK

    /**
     * Consultancy Agreement — Single (PhP 100,000) or Partner (PhP 150,000).
     * Stored against checklist_key='agree.consultancy'.
     */
    /**
     * English Engagement Agreement — PTE preparation services. No variant
     * (just one template). Stored against checklist_key='agree.engagement_english'.
     */
    public function englishEngagement(Lead $lead): LeadDocument
    {
        $clientName = trim("{$lead->first_name} {$lead->last_name}");
        $clientReference = Str::slug($clientName ?: 'ClientName', '');
        $today = now();
        $dateLine = $today->format('jS').' day of '.$today->format('F Y');

        $payload = [
            'client_name' => $clientName,
            'client_reference' => $clientReference ?: 'ClientName',
            'generated_at' => $today,
            'generated_at_formatted' => $dateLine,
        ];

        $pdf = Pdf::loadView('agreements.engagement-english', $payload)->setPaper('a4');
        $binary = $pdf->output();

        $safeName = $this->safeBaseName($clientName ?: 'Client');
        $filename = "Eng-{$safeName}.pdf";
        $path = "lead-documents/{$lead->id}/".Str::random(12)."-{$filename}";

        Storage::disk(self::DISK)->put($path, $binary);

        return LeadDocument::create([
            'lead_id' => $lead->id,
            'request_id' => null,
            'checklist_key' => 'agree.engagement_english',
            'original_name' => $filename,
            'file_path' => $path,
            'mime' => 'application/pdf',
            'size' => strlen($binary),
            'status' => LeadDocument::STATUS_SUBMITTED,
            'source' => LeadDocument::SOURCE_GENERATED,
            'source_variant' => 'engagement-english',
            'uploaded_by' => Auth::id(),
        ]);
    }

    /**
     * Consultancy Agreement — 4 scenarios. Staff pick which one applies
     * for a lead and can override the two editable fee amounts (School
     * Enrolment + English Proficiency) from the New modal.
     *
     * $scenario keys — see self::consultancyScenarios() for the full table.
     * $overrides    — ['school_enrolment_fee' => 100000, 'english_proficiency_fee' => 14500]
     */
    public function consultancy(Lead $lead, string $scenario, array $overrides = []): LeadDocument
    {
        [$payload, $scenarioMeta] = $this->buildConsultancyPayload($lead, $scenario, $overrides);

        // isPhpEnabled powers the page_text() footer at the end of the view
        // ("Page 3 of 9"). Scoped to this render — the template is ours and
        // every interpolated value is Blade-escaped, so no caller-supplied
        // markup can reach dompdf's script handler.
        $pdf = Pdf::loadView('agreements.consultancy', $payload)
            ->setPaper('a4')
            ->setOption('isPhpEnabled', true);
        $binary = $pdf->output();

        $safeName = $this->safeBaseName($payload['client_name'] ?: 'Client');
        $filename = "CA-{$safeName}-{$scenarioMeta['file_suffix']}.pdf";
        $path = "lead-documents/{$lead->id}/".Str::random(12)."-{$filename}";

        Storage::disk(self::DISK)->put($path, $binary);

        return LeadDocument::create([
            'lead_id' => $lead->id,
            'request_id' => null,
            'checklist_key' => 'agree.consultancy',
            'original_name' => $filename,
            'file_path' => $path,
            'mime' => 'application/pdf',
            'size' => strlen($binary),
            'status' => LeadDocument::STATUS_SUBMITTED,
            'source' => LeadDocument::SOURCE_GENERATED,
            // Encode applicant mode so the tracker / documents table can
            // surface "Single" vs "Couple" without re-opening the PDF.
            // Old rows without the suffix default to 'single' at read time.
            'source_variant' => "consultancy:{$scenarioMeta['key']}:{$payload['applicant_mode']}",
            'uploaded_by' => Auth::id(),
        ]);
    }

    /**
     * Public payload builder — shared by the PDF generator and by the
     * live-preview endpoint on LeadDocumentController so the preview
     * renders exactly what the PDF will contain.
     *
     * Returns [payload, scenarioMeta] — meta has the raw scenario
     * metadata so callers can log / suffix a filename with it.
     */
    public function buildConsultancyPayload(Lead $lead, string $scenario, array $overrides = []): array
    {
        $scenarios = self::consultancyScenarios();
        $s = $scenarios[$scenario] ?? $scenarios['std_100'];

        $clientName = trim("{$lead->first_name} {$lead->last_name}");
        $clientReference = Str::slug($clientName ?: 'ClientName', '') ?: 'ClientName';
        $today = now();

        // Only these two are editable from the modal. Everything else in
        // the cost-breakdown table stays static — those are canonical
        // reference amounts from the ePathways template.
        $schoolFee = (int) ($overrides['school_enrolment_fee'] ?? $s['default_school_fee']);
        $englishFee = (int) ($overrides['english_proficiency_fee'] ?? 14500);

        // Applicant mode — Single or Couple. Only meaningful for scenarios
        // that support both (Std 150, Voucher 150). Single-only scenarios
        // ignore the override and pin to 'single'. Drives both the
        // "MAIN APPLICANT (…)" line on page 1 and which cost breakdown
        // table renders on pages 3-4.
        $applicantMode = ($overrides['applicant_mode'] ?? 'single') === 'couple' ? 'couple' : 'single';
        if (! $s['supports_both']) {
            $applicantMode = 'single';
        }
        $applicantLabel = $applicantMode === 'couple'
            ? 'MAIN APPLICANT (Couple)'
            : 'MAIN APPLICANT (Single)';

        $payload = [
            // Full catalogue so the Application Type table can list every
            // scenario with only the chosen one ticked, matching the Word
            // original. The view keys off `scenario` to know which is live.
            'scenarios' => self::consultancyScenarios(),
            'scenario' => $s['key'],
            'scenario_number' => $s['number'],
            'scenario_title' => $s['title'],
            'scenario_applicant' => $applicantLabel,
            'scenario_description' => $s['description'],
            'scenario_has_voucher' => $s['has_voucher'],
            'applicant_mode' => $applicantMode,
            'supports_both' => $s['supports_both'],
            'is_couple_scenario' => $applicantMode === 'couple',
            'school_enrolment_fee' => $schoolFee,
            'english_proficiency_fee' => $englishFee,
            'inz_voucher_fee' => 30600,
            'client_name' => $clientName,
            'client_reference' => $clientReference,
            'generated_at' => $today,
            'generated_at_formatted' => $today->format('jS').' day of '.$today->format('F Y'),
        ];

        return [$payload, $s];
    }

    /**
     * The 4-scenario catalogue — matches the Word template's Application
     * Type table. `is_couple` toggles whether the couple cost breakdown
     * renders alongside the single one on pages 3-4 of the PDF.
     */
    public static function consultancyScenarios(): array
    {
        return [
            'std_150' => [
                'key' => 'std_150',
                'number' => 1,
                'title' => 'STANDARD 150,000',
                'applicant' => 'MAIN APPLICANT (Single and Couple)',
                'description' => 'School Enrollment and Documentation Fee, Immigration New Zealand (INZ) visa application fee',
                'default_school_fee' => 150000,
                'has_voucher' => false,
                'is_couple' => true,
                'supports_both' => true,
                'file_suffix' => 'std150',
            ],
            'voucher_150' => [
                'key' => 'voucher_150',
                'number' => 2,
                'title' => 'WITH VOUCHER 150,000',
                'applicant' => 'MAIN APPLICANT (Single and Couple)',
                'description' => 'School Enrollment and Documentation Fee, <strong>inclusive</strong> of the Immigration New Zealand (INZ) visa application fee',
                'default_school_fee' => 150000,
                'has_voucher' => true,
                'is_couple' => true,
                'supports_both' => true,
                'file_suffix' => 'voucher150',
            ],
            'std_100' => [
                'key' => 'std_100',
                'number' => 3,
                'title' => 'STANDARD',
                'applicant' => 'MAIN APPLICANT (Single)',
                'description' => 'School Enrollment and Documentation Fee',
                'default_school_fee' => 100000,
                'has_voucher' => false,
                'is_couple' => false,
                'supports_both' => false,
                'file_suffix' => 'std100',
            ],
            'english_100' => [
                'key' => 'english_100',
                'number' => 3,
                'title' => 'WITH ENGLISH',
                'applicant' => 'MAIN APPLICANT (Single)',
                'description' => 'School Enrollment and Documentation Fee',
                'default_school_fee' => 100000,
                'has_voucher' => false,
                'is_couple' => false,
                'supports_both' => false,
                'file_suffix' => 'english100',
            ],
        ];
    }

    /**
     * Study Proposal — placeholder template rendered per-lead. Stored
     * against checklist_key='agree.proposal' so it surfaces in the
     * Documents tab's Agreements section alongside the two existing
     * agreement types.
     */
    public function proposal(Lead $lead): LeadDocument
    {
        $clientName = trim("{$lead->first_name} {$lead->last_name}");
        $clientReference = Str::slug($clientName ?: 'ClientName', '');
        $today = now();
        $dateLine = $today->format('jS').' day of '.$today->format('F Y');

        $payload = [
            'client_name' => $clientName,
            'client_reference' => $clientReference ?: 'ClientName',
            'preferred_course' => $lead->preferred_course,
            'preferred_intake' => $lead->preferred_intake,
            'preferred_city_of_study' => $lead->preferred_city_of_study,
            'target_institution' => $lead->target_institution,
            'generated_at' => $today,
            'generated_at_formatted' => $dateLine,
        ];

        $pdf = Pdf::loadView('agreements.proposal', $payload)->setPaper('a4');
        $binary = $pdf->output();

        $safeName = $this->safeBaseName($clientName ?: 'Client');
        $filename = "Proposal-{$safeName}.pdf";
        $path = "lead-documents/{$lead->id}/".Str::random(12)."-{$filename}";

        Storage::disk(self::DISK)->put($path, $binary);

        return LeadDocument::create([
            'lead_id' => $lead->id,
            'request_id' => null,
            'checklist_key' => 'agree.proposal',
            'original_name' => $filename,
            'file_path' => $path,
            'mime' => 'application/pdf',
            'size' => strlen($binary),
            'status' => LeadDocument::STATUS_SUBMITTED,
            'source' => LeadDocument::SOURCE_GENERATED,
            'source_variant' => 'proposal',
            'uploaded_by' => Auth::id(),
        ]);
    }

    private function safeBaseName(string $name): string
    {
        // Strip spaces + non-alphanum so the filename is portable.
        return preg_replace('/[^A-Za-z0-9]/', '', $name) ?: 'Client';
    }
}
