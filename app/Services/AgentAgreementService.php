<?php

namespace App\Services;

use App\Models\AgentAgreement;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Generates the Referral Agent Agreement PDF for an agent (User role=agent).
 * Only the fillable fields + Schedule A commission structure are editable;
 * the rest of the agreement is fixed. One current agreement per agent —
 * generating replaces the previous one.
 */
class AgentAgreementService
{
    private const DISK = 'local';

    /**
     * Editable fields shown in the generate modal, grouped. Each field carries
     * its placeholder guide (rendered grey in the PDF when left blank).
     *
     * @return array<int, array{group:string, fields:array<int,array{key:string,label:string,placeholder:string,type?:string}>}>
     */
    public static function fieldGroups(): array
    {
        return [
            ['group' => 'Agreement', 'fields' => [
                ['key' => 'effective_date', 'label' => 'Effective date', 'placeholder' => 'e.g. 30th day of June, 2026'],
            ]],
            ['group' => 'Agent details', 'fields' => [
                ['key' => 'agent_full_name', 'label' => 'Agent full name', 'placeholder' => 'e.g. Lillian Novida Ejorango'],
                ['key' => 'agent_citizenship', 'label' => 'Citizenship', 'placeholder' => 'e.g. Canada'],
                ['key' => 'agent_passport', 'label' => 'Passport number', 'placeholder' => 'e.g. AK341265'],
                ['key' => 'agent_city', 'label' => 'City, country', 'placeholder' => 'e.g. Vancouver, Canada'],
            ]],
            ['group' => 'Schedule A — Commission rates', 'fields' => [
                ['key' => 'nz_1_5_rate', 'label' => 'New Zealand — 1 to 5 students', 'placeholder' => 'PhP 20,000'],
                ['key' => 'nz_6plus_rate', 'label' => 'New Zealand — 6 or more students', 'placeholder' => 'PhP 30,000'],
                ['key' => 'australia_rate', 'label' => 'Australia — all students', 'placeholder' => 'Negotiable (agreed in writing, case-by-case)'],
            ]],
            ['group' => 'Schedule A — Payment & other terms', 'fields' => [
                ['key' => 'commission_basis', 'label' => 'Commission basis', 'placeholder' => 'Per-student fee'],
                ['key' => 'payment_trigger', 'label' => 'Payment trigger', 'placeholder' => 'Enrolment and commencement of the course'],
                ['key' => 'payment_timing', 'label' => 'Payment timing', 'placeholder' => 'Within 15 days after the student commences the course'],
                ['key' => 'currency', 'label' => 'Currency', 'placeholder' => 'Philippine Peso (PhP)'],
                ['key' => 'australia_students', 'label' => 'Australia students', 'placeholder' => 'Commission is negotiable and agreed in writing before the referral is processed.', 'type' => 'textarea'],
                ['key' => 'refunds_withdrawals', 'label' => 'Refunds & withdrawals', 'placeholder' => 'No commission is payable where a student does not commence, withdraws, or whose fees are refunded.', 'type' => 'textarea'],
            ]],
            ['group' => 'Execution', 'fields' => [
                ['key' => 'company_signatory', 'label' => 'ePathways signatory', 'placeholder' => 'Dinah Suarin'],
                ['key' => 'company_title', 'label' => 'ePathways title', 'placeholder' => 'Founder'],
                ['key' => 'company_date', 'label' => 'ePathways date', 'placeholder' => 'e.g. June 30th 2026'],
                ['key' => 'agent_title', 'label' => 'Agent title', 'placeholder' => 'Agent'],
                ['key' => 'agent_date', 'label' => 'Agent date', 'placeholder' => 'Signed on…'],
            ]],
        ];
    }

    /** Flat list of every editable field key (for validation). */
    public static function fieldKeys(): array
    {
        return collect(self::fieldGroups())
            ->flatMap(fn ($g) => array_column($g['fields'], 'key'))
            ->all();
    }

    /**
     * Sensible starting values — the agent's name pre-filled, the standard
     * Schedule A rates/terms, and the company execution block. Blank fields
     * (passport, citizenship, dates…) fall back to the grey placeholder guide.
     */
    public function defaultFields(User $agent): array
    {
        return [
            'effective_date' => '',
            'agent_full_name' => $agent->name ?? '',
            'agent_citizenship' => '',
            'agent_passport' => '',
            'agent_city' => $agent->location ?? '',
            'nz_1_5_rate' => 'PhP 20,000',
            'nz_6plus_rate' => 'PhP 30,000',
            'australia_rate' => 'Negotiable (agreed in writing, case-by-case)',
            'commission_basis' => 'Per-student fee',
            'payment_trigger' => 'Enrolment and commencement of the course',
            'payment_timing' => 'Within 15 days after the student commences the course',
            'currency' => 'Philippine Peso (PhP)',
            'australia_students' => 'Commission is negotiable and agreed in writing before the referral is processed.',
            'refunds_withdrawals' => 'No commission is payable where a student does not commence, withdraws, or whose fees are refunded.',
            'company_signatory' => 'Dinah Suarin',
            'company_title' => 'Founder',
            'company_date' => '',
            'agent_title' => 'Agent',
            'agent_date' => '',
        ];
    }

    /** Merge caller-supplied field values onto defaults, keeping only known keys. */
    private function normaliseFields(User $agent, array $fields): array
    {
        $out = $this->defaultFields($agent);
        foreach (self::fieldKeys() as $key) {
            if (array_key_exists($key, $fields) && is_string($fields[$key])) {
                $out[$key] = mb_substr(trim($fields[$key]), 0, 500);
            }
        }

        return $out;
    }

    /**
     * Build the blade payload. $signatures may carry either party's captured
     * signature: ['agent' => ['data','name','date'], 'company' => [...]]. The
     * company signature falls back to the current staff member's signature-on-
     * file when nothing explicit has been captured (preview / first generate).
     */
    private function payload(User $agent, array $fields, array $signatures = []): array
    {
        $signer = Auth::user();

        $companyData = $signatures['company']['data']
            ?? ($signer && method_exists($signer, 'signatureDataUriTrimmed') ? $signer->signatureDataUriTrimmed() : null);

        return [
            'fields' => $fields,
            'agent_name' => $agent->name,
            'signer_name' => $signer?->name,
            // "For ePathways" cell — explicit company signature if signed, else
            // the staff signer's signature-on-file (legacy behaviour).
            'signer_signature' => $companyData,
            'company_signed_date' => $signatures['company']['date'] ?? null,
            // "For the Agent" cell — the agent's e-signature once they sign.
            'agent_signature' => $signatures['agent']['data'] ?? null,
            'agent_signed_name' => $signatures['agent']['name'] ?? null,
            'agent_signed_date' => $signatures['agent']['date'] ?? null,
        ];
    }

    /** Signatures captured so far on a stored agreement, for a re-render. */
    private function signaturesFrom(AgentAgreement $agreement): array
    {
        $sigs = [];
        if ($agreement->isSignedByAgent()) {
            $sigs['agent'] = [
                'data' => $agreement->agent_signature_data,
                'name' => $agreement->agent_signer_name,
                'date' => $agreement->agent_signed_at->format('j M Y'),
            ];
        }
        if ($agreement->isSignedByCompany()) {
            $sigs['company'] = [
                'data' => $agreement->company_signature_data,
                'name' => $agreement->company_signer_name,
                'date' => $agreement->company_signed_at->format('j M Y'),
            ];
        }

        return $sigs;
    }

    /** Re-render the stored agreement PDF with whatever signatures exist. */
    private function rebuild(AgentAgreement $agreement): void
    {
        $payload = $this->payload($agreement->agent, (array) $agreement->fields, $this->signaturesFrom($agreement));
        $binary = Pdf::loadView('agreements.agent-referral', $payload)->setPaper('a4')->output();

        Storage::disk(self::DISK)->put($agreement->file_path, $binary);
        $agreement->size = strlen($binary);
        $agreement->save();
    }

    /** Render the agreement as HTML for the live preview (no dompdf). */
    public function renderHtml(User $agent, array $fields): string
    {
        $payload = $this->payload($agent, $this->normaliseFields($agent, $fields));
        $payload['preview'] = true;

        return view('agreements.agent-referral', $payload)->render();
    }

    /** Generate the PDF, store it, and replace any existing agreement. */
    public function generate(User $agent, array $fields): AgentAgreement
    {
        $normalised = $this->normaliseFields($agent, $fields);
        $payload = $this->payload($agent, $normalised);

        $pdf = Pdf::loadView('agreements.agent-referral', $payload)->setPaper('a4');
        $binary = $pdf->output();

        $safeName = Str::slug($agent->name ?: 'Agent') ?: ('agent-'.$agent->id);
        $filename = "Referral-Agent-Agreement-{$safeName}.pdf";
        $path = "agent-agreements/{$agent->id}/".Str::random(12)."-{$filename}";

        Storage::disk(self::DISK)->put($path, $binary);

        // One current agreement per agent — drop the previous file + row.
        $existing = AgentAgreement::where('agent_id', $agent->id)->get();
        foreach ($existing as $old) {
            Storage::disk(self::DISK)->delete($old->file_path);
            $old->delete();
        }

        return AgentAgreement::create([
            'agent_id' => $agent->id,
            'fields' => $normalised,
            'file_path' => $path,
            'original_name' => $filename,
            'mime' => 'application/pdf',
            'size' => strlen($binary),
            'generated_by' => Auth::id(),
        ]);
    }

    /**
     * Record the agent's e-signature and re-render the PDF with it embedded in
     * the "For the Agent" cell. Mirrors the tracker signing flow: typed legal
     * name + base64 signature (drawn or uploaded) + IP/UA audit.
     */
    public function recordAgentSignature(AgentAgreement $agreement, string $signerName, string $signatureData, string $ip, ?string $userAgent): AgentAgreement
    {
        $agreement->agent_signer_name = $signerName;
        $agreement->agent_signature_data = $signatureData;
        $agreement->agent_signed_at = now();
        $agreement->agent_signed_ip = $ip;
        $agreement->agent_signed_user_agent = $userAgent;
        $agreement->save();

        $this->rebuild($agreement);

        return $agreement;
    }

    /**
     * Record the ePathways (staff) e-signature on the "For ePathways" cell —
     * same draw/upload capture as the agent side.
     */
    public function recordCompanySignature(AgentAgreement $agreement, string $signerName, string $signatureData): AgentAgreement
    {
        $agreement->company_signer_name = $signerName;
        $agreement->company_signature_data = $signatureData;
        $agreement->company_signed_at = now();
        $agreement->company_signed_by = Auth::id();
        $agreement->save();

        $this->rebuild($agreement);

        return $agreement;
    }
}
