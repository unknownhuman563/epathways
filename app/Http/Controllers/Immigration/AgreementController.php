<?php

namespace App\Http\Controllers\Immigration;

use App\Exceptions\MissingAgreementVariablesException;
use App\Http\Controllers\Controller;
use App\Models\Agreement;
use App\Models\AgreementTemplate;
use App\Models\Lead;
use App\Models\User;
use App\Services\Immigration\AgreementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Build 11.D Phase 2 — Agreement endpoints for the Case Profile.
 *
 * Role gate mirrors CaseProfileController exactly: admin + immigration
 * roles only. Each endpoint also re-checks is_immigration_case + the
 * agreement<->lead ownership so a cross-case URL guess returns 404.
 *
 * JSON endpoints are intended to be consumed by GenerateAgreementModal
 * and AgreementTab. Phase 1's CaseProfileController loads agreements
 * into Inertia props for first paint; these endpoints handle mutations
 * + reload data without a full page navigation.
 */
class AgreementController extends Controller
{
    public function __construct(protected AgreementService $service)
    {
    }

    /** GET /portal/immigration/cases/{lead}/agreements */
    public function index(Lead $lead)
    {
        $this->authorizeAccess($lead);

        $agreements = $lead->agreements()
            ->with(['template:id,name,visa_type', 'generatedBy:id,name'])
            ->latest()
            ->get()
            ->map(fn (Agreement $a) => $this->serialize($a));

        return response()->json(['agreements' => $agreements]);
    }

    /** GET /portal/immigration/cases/{lead}/agreements/templates */
    public function templates(Lead $lead)
    {
        $this->authorizeAccess($lead);

        $templates = AgreementTemplate::where('is_active', true)
            ->where(function ($q) use ($lead) {
                $q->whereNull('visa_type');
                if ($lead->inz_visa_type) {
                    $q->orWhere('visa_type', $lead->inz_visa_type);
                }
            })
            ->orderBy('visa_type')
            ->orderBy('name')
            ->get(['id', 'name', 'visa_type', 'required_variables', 'body']);

        return response()->json(['templates' => $templates]);
    }

    /** POST /portal/immigration/cases/{lead}/agreements */
    public function generate(Request $request, Lead $lead)
    {
        $this->authorizeAccess($lead);

        $validated = $request->validate([
            'agreement_template_id' => ['required', 'integer', 'exists:agreement_templates,id'],
            'extra_variables'       => ['sometimes', 'array'],
            'extra_variables.*'     => ['nullable', 'string', 'max:2000'],
        ]);

        $template = AgreementTemplate::findOrFail($validated['agreement_template_id']);

        try {
            $agreement = $this->service->generate(
                $lead,
                $template,
                $validated['extra_variables'] ?? []
            );
        } catch (MissingAgreementVariablesException $e) {
            return response()->json([
                'message' => 'Required variables not provided.',
                'missing' => $e->missing,
            ], 422);
        }

        return response()->json([
            'agreement' => $this->serialize($agreement->load(['template:id,name,visa_type', 'generatedBy:id,name'])),
        ], 201);
    }

    /** POST /portal/immigration/cases/{lead}/agreements/{agreement}/send */
    public function send(Lead $lead, Agreement $agreement)
    {
        $this->authorizeAccess($lead);
        $this->authorizeOwnership($lead, $agreement);

        try {
            $this->service->send($agreement);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'agreement' => $this->serialize($agreement->fresh(['template:id,name,visa_type', 'generatedBy:id,name'])),
        ]);
    }

    /** GET /portal/immigration/cases/{lead}/agreements/{agreement}/pdf */
    public function downloadPdf(Lead $lead, Agreement $agreement)
    {
        $this->authorizeAccess($lead);
        $this->authorizeOwnership($lead, $agreement);

        // Prefer the signed PDF (with embedded signature) once Phase 3 ships it.
        $path = $agreement->signed_pdf_path ?: $agreement->pdf_path;
        abort_unless($path && Storage::disk('local')->exists($path), 404, 'PDF not found.');

        return response()->download(
            Storage::disk('local')->path($path),
            $this->downloadFilename($agreement)
        );
    }

    /** POST /portal/immigration/cases/{lead}/agreements/{agreement}/void */
    public function void(Request $request, Lead $lead, Agreement $agreement)
    {
        $this->authorizeAccess($lead);
        $this->authorizeOwnership($lead, $agreement);

        $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        try {
            $this->service->void($agreement, $request->input('reason'));
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'agreement' => $this->serialize($agreement->fresh(['template:id,name,visa_type', 'generatedBy:id,name'])),
        ]);
    }

    private function authorizeAccess(Lead $lead): void
    {
        $user = auth()->user();
        abort_unless($user instanceof User, 403);

        // Mirrors CaseProfileController::ensureCanViewCases.
        abort_unless(
            $user->isAdmin()
                || $user->role === 'immigration'
                || in_array($user->role, User::IMMIGRATION_ROLES, true),
            403,
            'Only immigration staff may manage case agreements.'
        );

        abort_unless($lead->is_immigration_case, 404);
    }

    private function authorizeOwnership(Lead $lead, Agreement $agreement): void
    {
        abort_unless($agreement->lead_id === $lead->id, 404);
    }

    private function serialize(Agreement $agreement): array
    {
        return [
            'id'                    => $agreement->id,
            'title'                 => $agreement->title,
            'status'                => $agreement->status,
            'template'              => $agreement->template
                ? ['id' => $agreement->template->id, 'name' => $agreement->template->name, 'visa_type' => $agreement->template->visa_type]
                : null,
            'generated_by'          => $agreement->generatedBy?->name,
            'sent_at'               => $agreement->sent_at,
            'viewed_at'             => $agreement->viewed_at,
            'signed_at'             => $agreement->signed_at,
            'signer_name'           => $agreement->signer_name,
            'signer_ip'             => $agreement->signer_ip,
            'has_pdf'               => (bool) $agreement->pdf_path,
            'has_signed_pdf'        => (bool) $agreement->signed_pdf_path,
            'tracker_signing_token' => $agreement->tracker_signing_token,
            'created_at'            => $agreement->created_at,
        ];
    }

    private function downloadFilename(Agreement $agreement): string
    {
        $safeTitle = preg_replace('/[^A-Za-z0-9]+/', '_', $agreement->title) ?: 'agreement';
        $suffix    = $agreement->signed_pdf_path ? '-signed' : '';
        return "{$safeTitle}{$suffix}.pdf";
    }
}
