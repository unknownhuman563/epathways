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

    private function payload(User $agent, array $fields): array
    {
        $signer = Auth::user();

        return [
            'fields' => $fields,
            'agent_name' => $agent->name,
            'signer_name' => $signer?->name,
            'signer_signature' => $signer && method_exists($signer, 'signatureDataUriTrimmed')
                ? $signer->signatureDataUriTrimmed()
                : null,
        ];
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
}
