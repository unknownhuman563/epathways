<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Program;
use App\Traits\BuildsLeadRow;
use App\Traits\CreatesDashboardLead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * Recruiting Agent portal. An agent works alongside sales but only ever sees
 * the leads THEY added (scoped by leads.agent_id). They can add a lead and
 * edit its basic info — but NOT change its stage/status, convert it, or
 * delete it. Those pipeline actions stay with sales/admin.
 */
class AgentController extends Controller
{
    use BuildsLeadRow, CreatesDashboardLead;

    /** Statuses shown (read-only) on the agent's own leads. */
    private const LEAD_STATUSES = [
        'New Leads', 'Attempted to Contact', 'Contacted', 'For Assessment',
        'Consultation Booked', 'Consultation Done', 'For Proposal',
        'Proposal Sent', 'Converted', 'Not Interested', 'Lost',
    ];

    /** Only this agent's leads, newest first. */
    private function ownLeadsQuery()
    {
        return Lead::where('agent_id', Auth::id());
    }

    public function dashboard()
    {
        $agentId = Auth::id();
        $base = fn () => Lead::where('agent_id', $agentId);

        $recent = $base()
            ->with(['studyPlans', 'tags:id,name', 'notes' => fn ($q) => $q->latest(), 'documents:id,lead_id,checklist_key,status'])
            ->withCount(['notes', 'documents'])
            ->withCount(['tasks as tasks_open_count' => fn ($q) => $q->where('completed', false)])
            ->latest()
            ->limit(8)
            ->get();

        return inertia('portal/agent/Dashboard', [
            'stats' => [
                'total'      => $base()->count(),
                'this_week'  => $base()->where('created_at', '>=', now()->startOfWeek())->count(),
                'this_month' => $base()->where('created_at', '>=', now()->startOfMonth())->count(),
                'converted'  => $base()->where(fn ($q) => $q->where('status', 'Converted')->orWhere('is_student', true)->orWhere('is_immigration_case', true))->count(),
            ],
            'recent' => $recent->map(fn ($l) => $this->leadRow($l)),
        ]);
    }

    /** The agent's own leads list (add + edit-info only). */
    public function leads()
    {
        try {
            $leads = $this->ownLeadsQuery()
                ->with([
                    'studyPlans',
                    'tags:id,name',
                    'notes' => fn ($q) => $q->latest(),
                    'documents:id,lead_id,checklist_key,status',
                ])
                ->withCount(['notes', 'documents'])
                ->withCount(['tasks as tasks_open_count' => fn ($q) => $q->where('completed', false)])
                ->latest()
                ->get();

            return inertia('portal/agent/Leads', [
                'portal'   => 'agent',
                'statuses' => self::LEAD_STATUSES,
                'programs' => Program::orderBy('title')->pluck('title')->filter()->values(),
                'leads'    => $leads->map(fn ($l) => $this->leadRow($l)),
            ]);
        } catch (\Throwable $e) {
            Log::error('Agent leads list failed', ['error' => $e->getMessage()]);

            return inertia('portal/agent/Leads', [
                'portal' => 'agent', 'statuses' => self::LEAD_STATUSES,
                'programs' => collect(), 'leads' => collect(),
            ]);
        }
    }

    /** Add a new lead — agent_id is auto-stamped by CreatesDashboardLead. */
    public function storeLead(Request $request)
    {
        $validated = $request->validate($this->dashboardLeadRules(self::LEAD_STATUSES));

        $this->createDashboardLead($validated);

        return back()->with('success', 'Lead added successfully.');
    }

    /**
     * Edit a lead's basic contact / personal info. Ownership-checked: an
     * agent may only edit a lead they added. Deliberately does NOT touch
     * stage, status, priority, or any conversion flag.
     */
    public function updateLeadInfo(Request $request, $id)
    {
        $lead = Lead::where('id', $id)->where('agent_id', Auth::id())->firstOrFail();

        $validated = $request->validate([
            'first_name'        => 'required|string|max:120',
            'last_name'         => 'nullable|string|max:120',
            'suffix'            => 'nullable|string|max:30',
            'email'             => 'nullable|email|max:200',
            'phone'             => 'nullable|string|max:40',
            'residence_city'    => 'nullable|string|max:120',
            'residence_country' => 'nullable|string|max:120',
            'program_offered'   => 'nullable|string|max:200',
        ]);

        $lead->first_name = trim($validated['first_name']);
        $lead->last_name = trim(($validated['last_name'] ?? '') . ' ' . ($validated['suffix'] ?? ''));
        $lead->email = $validated['email'] ?? null;
        $lead->phone = $validated['phone'] ?? null;
        $lead->residence_city = $validated['residence_city'] ?? null;
        $lead->residence_country = $validated['residence_country'] ?? null;
        $lead->save();

        // PROGRAM OFFERED → mirror into the lead's study plan (create/update
        // the first one) so it reads back in the leads table.
        if (! empty($validated['program_offered'])) {
            $plan = $lead->studyPlans()->first();
            if ($plan) {
                $plan->update(['preferred_course' => $validated['program_offered']]);
            } else {
                $lead->studyPlans()->create([
                    'preferred_course'    => $validated['program_offered'],
                    'qualification_level' => '',
                ]);
            }
        }

        return back()->with('success', 'Lead info updated.');
    }
}
