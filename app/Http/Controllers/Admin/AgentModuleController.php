<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AgentAgreement;
use App\Models\Lead;
use App\Models\User;
use App\Services\AgentAgreementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Agents module — a dedicated surface (gated by `module:agents`) to manage
 * referral agents, view their leads, and generate/store their Referral Agent
 * Agreement. Agents are Users with role=agent.
 */
class AgentModuleController extends Controller
{
    public function index(Request $request)
    {
        $agents = User::where('role', 'agent')
            ->withCount('agentLeads')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'phone', 'location', 'avatar_path', 'referral_code'])
            ->map(fn (User $a) => [
                'id' => $a->id,
                'name' => $a->name,
                'email' => $a->email,
                'phone' => $a->phone,
                'location' => $a->location,
                'avatar_url' => $a->avatar_url,
                'referral_code' => $a->referral_code,
                'leads_count' => $a->agent_leads_count,
                'has_agreement' => AgentAgreement::where('agent_id', $a->id)->exists(),
            ]);

        return inertia('admin/agents/Index', [
            'agents' => $agents,
        ]);
    }

    public function show(Request $request, User $agent, AgentAgreementService $service)
    {
        abort_unless($agent->role === 'agent', 404);

        $leads = Lead::where('agent_id', $agent->id)
            ->orderByDesc('created_at')
            ->limit(200)
            ->get(['id', 'lead_id', 'first_name', 'last_name', 'status', 'email', 'phone', 'residence_city', 'residence_country', 'country', 'created_at'])
            ->map(fn (Lead $l) => [
                'id' => $l->id,
                'lead_id' => $l->lead_id,
                'name' => trim("{$l->first_name} {$l->last_name}") ?: '—',
                'status' => $l->status,
                'email' => $l->email,
                'phone' => $l->phone,
                // Combined "Location" label — city + country when present.
                'location' => trim(implode(', ', array_filter([
                    $l->residence_city,
                    $l->residence_country ?: $l->country,
                ]))) ?: null,
                'created_at' => optional($l->created_at)?->toIso8601String(),
            ]);

        $agreement = AgentAgreement::where('agent_id', $agent->id)->latest()->first();

        return inertia('admin/agents/Show', [
            'agent' => [
                'id' => $agent->id,
                'name' => $agent->name,
                'email' => $agent->email,
                'phone' => $agent->phone,
                'location' => $agent->location,
                'avatar_url' => $agent->avatar_url,
                'referral_code' => $agent->referral_code,
            ],
            'leads' => $leads,
            'leadsCount' => $leads->count(),
            'agreement' => $agreement ? [
                'id' => $agreement->id,
                'original_name' => $agreement->original_name,
                'size' => $agreement->size,
                'fields' => $agreement->fields,
                'created_at' => optional($agreement->created_at)?->toIso8601String(),
                'download_url' => "/admin/agents/{$agent->id}/agreement/download",
                'view_url' => "/admin/agents/{$agent->id}/agreement/view",
                'sign_url' => "/admin/agents/{$agent->id}/agreement/sign",
                'agent_signed' => $agreement->isSignedByAgent(),
                'agent_signer_name' => $agreement->agent_signer_name,
                'agent_signed_at' => optional($agreement->agent_signed_at)?->toIso8601String(),
                'company_signed' => $agreement->isSignedByCompany(),
                'company_signer_name' => $agreement->company_signer_name,
                'company_signed_at' => optional($agreement->company_signed_at)?->toIso8601String(),
            ] : null,
            'agreementFieldGroups' => AgentAgreementService::fieldGroups(),
            'agreementDefaults' => $agreement->fields ?? $service->defaultFields($agent),
            'previewBase' => "/admin/agents/{$agent->id}/agreement/preview",
        ]);
    }

    /** Live HTML preview of the agreement with the current field values. */
    public function previewAgreement(Request $request, User $agent, AgentAgreementService $service)
    {
        abort_unless($agent->role === 'agent', 404);

        $fields = $request->only(AgentAgreementService::fieldKeys());
        $html = $service->renderHtml($agent, $fields);

        return response($html)->header('Content-Type', 'text/html; charset=utf-8');
    }

    public function generateAgreement(Request $request, User $agent, AgentAgreementService $service)
    {
        abort_unless($agent->role === 'agent', 404);

        $validated = $request->validate(
            collect(AgentAgreementService::fieldKeys())
                ->mapWithKeys(fn ($key) => [$key => ['nullable', 'string', 'max:500']])
                ->all()
        );

        $service->generate($agent, $validated);

        return back()->with('success', "Referral Agent Agreement generated for {$agent->name}.");
    }

    public function downloadAgreement(Request $request, User $agent)
    {
        abort_unless($agent->role === 'agent', 404);

        $agreement = AgentAgreement::where('agent_id', $agent->id)->latest()->firstOrFail();

        abort_unless(Storage::disk('local')->exists($agreement->file_path), 404);

        return Storage::disk('local')->download($agreement->file_path, $agreement->original_name);
    }

    /** Stream the agreement PDF inline (viewable in the browser, no download). */
    public function viewAgreement(Request $request, User $agent)
    {
        abort_unless($agent->role === 'agent', 404);

        $agreement = AgentAgreement::where('agent_id', $agent->id)->latest()->firstOrFail();
        abort_unless(Storage::disk('local')->exists($agreement->file_path), 404);

        return response()->file(Storage::disk('local')->path($agreement->file_path), [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$agreement->original_name.'"',
        ]);
    }

    /** Staff signs the "For ePathways" side — same draw/upload capture. */
    public function signAgreement(Request $request, User $agent, AgentAgreementService $service)
    {
        abort_unless($agent->role === 'agent', 404);

        $validated = $request->validate([
            'signer_name' => ['required', 'string', 'max:200'],
            'signature_data' => ['required', 'string', 'max:5000000'],
        ]);

        $agreement = AgentAgreement::where('agent_id', $agent->id)->latest()->firstOrFail();
        abort_if($agreement->isSignedByCompany(), 422, 'The ePathways side is already signed.');

        $service->recordCompanySignature($agreement, trim($validated['signer_name']), $validated['signature_data']);

        return back()->with('success', 'Agreement signed for ePathways.');
    }
}
