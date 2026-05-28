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
        $dateLine = $today->format('jS') . ' day of ' . $today->format('F Y');

        $payload = [
            'client_name'            => $clientName,
            'client_reference'       => $clientReference ?: 'ClientName',
            'generated_at'           => $today,
            'generated_at_formatted' => $dateLine,
        ];

        $pdf = Pdf::loadView('agreements.engagement-english', $payload)->setPaper('a4');
        $binary = $pdf->output();

        $safeName = $this->safeBaseName($clientName ?: 'Client');
        $filename = "Eng-{$safeName}.pdf";
        $path     = "lead-documents/{$lead->id}/" . Str::random(12) . "-{$filename}";

        Storage::disk(self::DISK)->put($path, $binary);

        return LeadDocument::create([
            'lead_id'        => $lead->id,
            'request_id'     => null,
            'checklist_key'  => 'agree.engagement_english',
            'original_name'  => $filename,
            'file_path'      => $path,
            'mime'           => 'application/pdf',
            'size'           => strlen($binary),
            'status'         => LeadDocument::STATUS_SUBMITTED,
            'source'         => LeadDocument::SOURCE_GENERATED,
            'source_variant' => 'engagement-english',
            'uploaded_by'    => Auth::id(),
        ]);
    }

    public function consultancy(Lead $lead, string $variant): LeadDocument
    {
        $variant = $variant === 'partner' ? 'partner' : 'single';

        $clientName = trim("{$lead->first_name} {$lead->last_name}");
        $clientReference = Str::slug($clientName ?: 'ClientName', '');

        $isPartner = $variant === 'partner';
        $today = now();
        // Avoid date()'s escape-sequence pitfalls (\f = form feed in some
        // contexts) by concatenating the format parts instead of one big
        // format string with backslash-escaped letters.
        $dateLine = $today->format('jS') . ' day of ' . $today->format('F Y');

        $payload = [
            'variant'              => $variant,
            'title'                => $isPartner ? 'ENGAGEMENT AGREEMENT' : 'CONSULTANCY AGREEMENT',
            'client_name'          => $clientName,
            'client_reference'     => $clientReference ?: 'ClientName',
            'fee_label'            => $isPartner ? 'PhP 150,000.00' : 'PhP 100,000.00',
            'stage_label'          => $isPartner
                ? 'School Enrollment [Main Applicant] and Documentation [Main Applicant + Partner]'
                : 'School Enrollment [Single Applicant] and Documentation [Single Applicant]',
            'generated_at'           => $today,
            'generated_at_formatted' => $dateLine,
        ];

        $pdf = Pdf::loadView('agreements.consultancy', $payload)
            ->setPaper('a4');

        $binary = $pdf->output();

        $safeName = $this->safeBaseName($clientName ?: 'Client');
        $filename = "CA-{$safeName}-{$variant}.pdf";
        $path     = "lead-documents/{$lead->id}/" . Str::random(12) . "-{$filename}";

        Storage::disk(self::DISK)->put($path, $binary);

        return LeadDocument::create([
            'lead_id'        => $lead->id,
            'request_id'     => null,
            'checklist_key'  => 'agree.consultancy',
            'original_name'  => $filename,
            'file_path'      => $path,
            'mime'           => 'application/pdf',
            'size'           => strlen($binary),
            'status'         => LeadDocument::STATUS_SUBMITTED,
            'source'         => LeadDocument::SOURCE_GENERATED,
            'source_variant' => "consultancy:{$variant}",
            'uploaded_by'    => Auth::id(),
        ]);
    }

    private function safeBaseName(string $name): string
    {
        // Strip spaces + non-alphanum so the filename is portable.
        return preg_replace('/[^A-Za-z0-9]/', '', $name) ?: 'Client';
    }
}
