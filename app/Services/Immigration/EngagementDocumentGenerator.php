<?php

namespace App\Services\Immigration;

use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\VisaType;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Generates the immigration "engagement" documents for a case — the
 * Written Agreement (bound to the case + its visa fees from the Visas
 * page) plus the three standard IAA documents (Professional Standards,
 * Code of Conduct, Complaints Procedure).
 *
 * Each rendered PDF is stored as a LeadDocument (source='generated') so
 * it surfaces on the case's Documents tab and the Engagement workspace.
 * The same Blade views back the live HTML preview via renderHtml().
 */
class EngagementDocumentGenerator
{
    private const DISK = 'local';

    /** Immigration-team contact block shown on every cover. */
    private const CONTACT = [
        'email' => 'dev@epathways.co.nz',
        'phone' => '+64 22 188 2800',
        'website' => 'epathways.co.nz/immigration',
    ];

    /**
     * Document catalogue. `dynamic` flags the Written Agreement, which
     * pulls client + visa-fee data; the other three are standard docs.
     */
    public const DOCS = [
        'written_agreement' => [
            'view' => 'agreements.engagement.written-agreement',
            'header' => 'WRITTEN AGREEMENT',
            'label' => 'Written Agreement',
            'description' => 'Immigration advice services agreement — client details and fees from the case.',
            'eyebrow' => 'Immigration Advice Services',
            'cover_title' => 'WRITTEN<br>AGREEMENT',
            'cover_subtitle' => 'Immigration Advice Services',
            'prefix' => 'WrittenAgreement',
            'dynamic' => true,
        ],
        'professional_standards' => [
            'view' => 'agreements.engagement.professional-standards',
            'header' => 'PROFESSIONAL STANDARDS',
            'label' => 'Professional Standards',
            'description' => 'Summary of licensed immigration advisers\' professional standards.',
            'eyebrow' => 'Licensed Immigration Advisers',
            'cover_title' => 'PROFESSIONAL<br>STANDARDS',
            'cover_subtitle' => null,
            'prefix' => 'ProfessionalStandards',
            'dynamic' => false,
        ],
        'code_of_conduct' => [
            'view' => 'agreements.engagement.code-of-conduct',
            'header' => 'CODE OF CONDUCT',
            'label' => 'Code of Conduct',
            'description' => 'Licensed Immigration Advisers Code of Conduct 2014.',
            'eyebrow' => 'Licensed Immigration Advisers',
            'cover_title' => 'CODE OF<br>CONDUCT',
            'cover_subtitle' => '2014',
            'prefix' => 'CodeOfConduct',
            'dynamic' => false,
        ],
        'complaints_procedure' => [
            'view' => 'agreements.engagement.complaints-procedure',
            'header' => 'COMPLAINTS PROCEDURE',
            'label' => 'Complaints Procedure',
            'description' => 'Internal complaints procedure provided to the client.',
            'eyebrow' => null,
            'cover_title' => 'COMPLAINTS<br>PROCEDURE',
            'cover_subtitle' => null, // set to the current year at render time
            'prefix' => 'ComplaintsProcedure',
            'dynamic' => false,
        ],
    ];

    /** Lightweight catalogue for the frontend document picker. */
    public static function catalogue(): array
    {
        return collect(self::DOCS)->map(fn ($d, $key) => [
            'key' => $key,
            'label' => $d['label'],
            'description' => $d['description'],
            'dynamic' => $d['dynamic'],
        ])->values()->all();
    }

    /** Render a document to HTML (for the live preview iframe). */
    public function renderHtml(Lead $lead, string $type, array $overrides = []): string
    {
        [$view, $payload] = $this->resolve($lead, $type, $overrides);
        $payload['preview'] = true; // adds the on-screen A4 page frame

        return view($view, $payload)->render();
    }

    /** Render a document to a PDF and store it against the case. */
    public function generate(Lead $lead, string $type, array $overrides = []): LeadDocument
    {
        [$view, $payload, $meta] = $this->resolve($lead, $type, $overrides, withMeta: true);

        $binary = Pdf::loadView($view, $payload)->setPaper('a4')->output();

        $safeName = preg_replace('/[^A-Za-z0-9]/', '', trim("{$lead->first_name} {$lead->last_name}")) ?: 'Client';
        $filename = "{$meta['prefix']}-{$safeName}.pdf";
        $path = "lead-documents/{$lead->id}/".Str::random(12)."-{$filename}";

        Storage::disk(self::DISK)->put($path, $binary);

        return LeadDocument::create([
            'lead_id' => $lead->id,
            'request_id' => null,
            'checklist_key' => "engage.{$type}",
            'original_name' => $filename,
            'file_path' => $path,
            'mime' => 'application/pdf',
            'size' => strlen($binary),
            'status' => LeadDocument::STATUS_SUBMITTED,
            'source' => LeadDocument::SOURCE_GENERATED,
            'source_variant' => "engagement:{$type}",
            'uploaded_by' => Auth::id(),
        ]);
    }

    /**
     * Build [view, payload(, meta)] for a document type. Unknown types
     * throw so callers surface a 422 rather than rendering an empty doc.
     */
    private function resolve(Lead $lead, string $type, array $overrides, bool $withMeta = false): array
    {
        $meta = self::DOCS[$type] ?? null;
        abort_if($meta === null, 422, "Unknown engagement document: {$type}");

        // Complaints Procedure cover carries the current year (can't live in
        // the const array since it needs a runtime value).
        $coverSubtitle = $type === 'complaints_procedure' ? date('Y') : $meta['cover_subtitle'];

        $payload = [
            'logo_data' => $this->logoData(),
            'contact' => self::CONTACT,
            'doc_header' => $meta['header'],
            'cover_eyebrow' => $meta['eyebrow'],
            'cover_title' => $meta['cover_title'],
            'cover_subtitle' => $coverSubtitle,
        ];

        if ($meta['dynamic']) {
            $payload = array_merge($payload, $this->writtenAgreementData($lead, $overrides));
        }

        return $withMeta ? [$meta['view'], $payload, $meta] : [$meta['view'], $payload];
    }

    /** Client + visa-fee + signing-adviser data for the Written Agreement. */
    private function writtenAgreementData(Lead $lead, array $overrides): array
    {
        $visa = $lead->inz_visa_type
            ? VisaType::where('name', $lead->inz_visa_type)->first()
            : null;

        $professionalFee = $overrides['professional_fee'] ?? ($visa?->professional_fees);
        $inzFee = $overrides['inz_application_fee'] ?? ($visa?->inz_application_fee);

        return [
            'client' => [
                'name' => trim("{$lead->first_name} {$lead->middle_name} {$lead->last_name}") ?: trim("{$lead->first_name} {$lead->last_name}"),
                'address' => $overrides['client_address'] ?? $this->clientAddress($lead),
                'phone' => $lead->phone,
                'email' => $lead->email,
            ],
            'visa_category' => $overrides['visa_category'] ?? $lead->inz_visa_type,
            'professional_fee' => $this->money($professionalFee),
            'inz_fee' => $this->money($inzFee),
            'adviser' => $this->adviser($overrides['signer_id'] ?? null),
            'generated_date' => now()->format('d/m/Y'),
        ];
    }

    /**
     * Signing adviser block for the agreement — name, licence, and the
     * signature image (data URI). Falls back to the firm's main adviser
     * when no signer is chosen / found.
     */
    private function adviser($signerId): array
    {
        $user = $signerId ? \App\Models\User::find($signerId) : null;

        if (! $user) {
            return ['name' => 'Yuxiang (Hendry) DAI', 'licence' => '201500074', 'signature' => null];
        }

        return [
            'name' => $user->name,
            'licence' => $user->iaa_licence_number,
            'signature' => $user->signatureDataUri(),
        ];
    }

    private function clientAddress(Lead $lead): ?string
    {
        $parts = array_filter([
            $lead->residence_address_line_1 ?? null,
            $lead->residence_address_line_2 ?? null,
            $lead->residence_city,
            $lead->residence_state,
            $lead->residence_country,
        ]);

        return $parts ? implode(', ', $parts) : null;
    }

    /** Format a NZD amount, or null/empty for a zero/blank so the
     *  template renders its "[Amount]" placeholder. */
    private function money($value): ?string
    {
        if ($value === null || $value === '' || (float) $value <= 0) {
            return null;
        }

        return '$'.number_format((float) $value, 2);
    }

    /** Base64 data URI of the ePathways Migration logo for cover + PDF. */
    private function logoData(): string
    {
        $path = base_path('resources/assets/Immigration/migration_logo.png');
        if (! is_file($path)) {
            $path = base_path('resources/assets/philipine_ep_logo.png');
        }

        return 'data:image/png;base64,'.base64_encode(file_get_contents($path));
    }
}
