<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Controllers\LeadNoteController;
use App\Models\Lead;
use App\Models\User;
use App\Traits\CreatesDashboardLead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Sub-agent portal — a sales-style pipeline scoped to ONE recruiting agent's
 * referral leads (the sub-agent's `parent_agent_id`). Every read and write is
 * row-scoped to `agent_id = parent_agent_id`, so a sub-agent can never see or
 * touch a lead outside their agent's referrals. Writes re-check ownership and
 * then delegate to the existing (validated) sales / note handlers.
 */
class SubAgentController extends Controller
{
    use CreatesDashboardLead;

    /** The agent this sub-agent works under, or null if unassigned. */
    private function parentAgentId(): ?int
    {
        return Auth::user()?->parent_agent_id;
    }

    /** Base query — only the parent agent's referral leads. */
    private function scoped()
    {
        return Lead::where('agent_id', $this->parentAgentId());
    }

    /** Resolve a lead this sub-agent is allowed to touch, or 404. */
    private function findScoped($id): Lead
    {
        abort_if(! $this->parentAgentId(), 404);

        return $this->scoped()->where('id', $id)->firstOrFail();
    }

    public function dashboard()
    {
        $agentId = $this->parentAgentId();
        $agent = $agentId ? User::find($agentId) : null;
        $base = fn () => Lead::where('agent_id', $agentId);

        return inertia('portal/sub-agent/Dashboard', [
            'agent' => $agent ? ['name' => $agent->name, 'referral_code' => $agent->referral_code] : null,
            'stats' => $agentId ? [
                'total' => $base()->count(),
                'in_pipeline' => $base()->whereNotIn('status', ['Closed', 'Not Qualified'])->count(),
                'new_today' => $base()->whereDate('created_at', now()->toDateString())->count(),
                'converted' => $base()->where(fn ($q) => $q->where('is_student', true)->orWhere('is_immigration_case', true))->count(),
            ] : ['total' => 0, 'in_pipeline' => 0, 'new_today' => 0, 'converted' => 0],
        ]);
    }

    /** Leads list — reuses the Sales "agent leads" screen, scoped to the parent agent. */
    public function leads()
    {
        $agentId = $this->parentAgentId();

        // No agent assigned yet → render the same page empty with a notice.
        if (! $agentId) {
            return inertia('portal/sub-agent/AgentLeads', [
                'agent' => ['name' => 'No agent assigned', 'email' => null, 'phone' => null],
                'leads' => [],
                'statuses' => [],
                'portalBase' => '/portal/sub-agent',
            ]);
        }

        return app(SalesController::class)->agentLeadsPage($agentId);
    }

    /** Stage/status update — ownership re-checked, then the sales handler runs. */
    public function updateLead(Request $request, $id)
    {
        $this->findScoped($id);

        return app(SalesController::class)->updateLead($request, $id);
    }

    /** Add a note — ownership re-checked, then the shared note handler runs. */
    public function storeNote(Request $request, $id)
    {
        $this->findScoped($id);

        return app(LeadNoteController::class)->store($request, $id);
    }

    /** Set a lead's priority (Urgent/Normal/Low) — ownership re-checked. */
    public function updatePriority(Request $request, $id)
    {
        $lead = $this->findScoped($id);

        // Matches the general lead priority vocabulary (urgent | medium | low);
        // the UI labels "medium" as "Normal".
        $validated = $request->validate([
            'priority' => ['required', 'in:urgent,medium,low'],
        ]);

        $lead->priority = $validated['priority'];
        $lead->save();

        return back()->with('success', "Lead {$lead->lead_id} priority updated.");
    }

    /** Quick-add a referral lead under the parent agent (sales-style). */
    public function storeLead(Request $request)
    {
        $agentId = $this->parentAgentId();
        abort_if(! $agentId, 404);

        $validated = $request->validate([
            'first_name' => 'required|string|max:120',
            'last_name' => 'nullable|string|max:120',
            'email' => 'nullable|email|max:200',
            'phone' => 'nullable|string|max:40',
        ]);

        // Force the parent agent as the recruiting agent — the new lead lands
        // in this sub-agent's scoped pipeline (agent_id = parent_agent_id).
        $validated['agent_id'] = $agentId;
        $this->createDashboardLead($validated);

        return back()->with('success', 'Lead added.');
    }

    public function profile()
    {
        $user = Auth::user();
        $agent = $user->parent_agent_id ? User::find($user->parent_agent_id) : null;

        return inertia('portal/sub-agent/Profile', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'location' => $user->location,
                'avatar_url' => $user->avatar_url,
            ],
            'agent' => $agent ? ['name' => $agent->name, 'referral_code' => $agent->referral_code] : null,
        ]);
    }
}
