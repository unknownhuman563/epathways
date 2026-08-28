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

    /**
     * The only document types a sub-agent handles on a referral lead. Fixed set —
     * they collect these four from the applicant, nothing else.
     */
    private const DOC_TYPES = [
        'subagent_passport' => 'Passport',
        'subagent_cv'       => 'CV / Resume',
        'subagent_diploma'  => 'Diploma',
        'subagent_tor'      => 'Transcript of Records (TOR)',
    ];

    /** JSON: the four document slots for a lead, with the uploaded file (if any). */
    public function documents($id)
    {
        $lead = $this->findScoped($id);

        $docs = \App\Models\LeadDocument::where('lead_id', $lead->id)
            ->whereIn('checklist_key', array_keys(self::DOC_TYPES))
            ->latest('id')->get()->keyBy('checklist_key');

        $slots = [];
        foreach (self::DOC_TYPES as $key => $label) {
            $d = $docs->get($key);
            $slots[] = [
                'type'  => $key,
                'label' => $label,
                'file'  => $d ? [
                    'id'   => $d->id,
                    'name' => $d->original_name,
                    'url'  => "/portal/sub-agent/leads/{$lead->id}/documents/{$d->id}/download",
                ] : null,
            ];
        }

        return response()->json(['slots' => $slots]);
    }

    /** Upload (or replace) one of the four documents for a scoped lead. */
    public function storeDocument(Request $request, $id)
    {
        $lead = $this->findScoped($id);

        $data = $request->validate([
            'type' => ['required', \Illuminate\Validation\Rule::in(array_keys(self::DOC_TYPES))],
            'file' => ['required', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:10240'],
        ]);

        // Replace any existing file of this type (upload = latest wins).
        \App\Models\LeadDocument::where('lead_id', $lead->id)
            ->where('checklist_key', $data['type'])
            ->get()
            ->each(function (\App\Models\LeadDocument $old) {
                if ($old->file_path && \Illuminate\Support\Facades\Storage::disk('local')->exists($old->file_path)) {
                    \Illuminate\Support\Facades\Storage::disk('local')->delete($old->file_path);
                }
                $old->delete();
            });

        $file = $request->file('file');
        $path = $file->store("lead-documents/{$lead->id}", 'local');
        \App\Models\LeadDocument::create([
            'lead_id'        => $lead->id,
            'checklist_key'  => $data['type'],
            'original_name'  => $file->getClientOriginalName(),
            'file_path'      => $path,
            'mime'           => $file->getClientMimeType(),
            'size'           => $file->getSize(),
            'status'         => \App\Models\LeadDocument::STATUS_SUBMITTED,
            'source'         => \App\Models\LeadDocument::SOURCE_UPLOAD,
            'uploaded_by'    => Auth::id(),
        ]);

        return back()->with('success', self::DOC_TYPES[$data['type']].' uploaded.');
    }

    /** Stream a scoped document from the private disk (never a public URL). */
    public function downloadDocument($id, $docId)
    {
        $lead = $this->findScoped($id);

        $doc = \App\Models\LeadDocument::where('lead_id', $lead->id)
            ->whereIn('checklist_key', array_keys(self::DOC_TYPES))
            ->where('id', $docId)
            ->firstOrFail();

        abort_unless($doc->file_path && \Illuminate\Support\Facades\Storage::disk('local')->exists($doc->file_path), 404);

        return \Illuminate\Support\Facades\Storage::disk('local')->download($doc->file_path, $doc->original_name);
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
