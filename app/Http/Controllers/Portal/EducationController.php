<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Program;
use App\Traits\BuildsLeadRow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class EducationController extends Controller
{
    use BuildsLeadRow;

    private const LEAD_STATUSES = Lead::STAGES;

    /** Education overview: programs, students (study-plan leads), recent intakes. */
    public function dashboard()
    {
        try {
            $now = now();
            $monthStart = $now->copy()->startOfMonth();

            $programStats = [
                'total' => Program::count(),
                'published' => Program::where('status', 'published')->count(),
                'draft' => Program::where('status', 'draft')->count(),
                'archived' => Program::where('status', 'archived')->count(),
            ];

            $studentStats = [
                'total_with_plan' => Lead::has('studyPlans')->count(),
                'this_month' => Lead::has('studyPlans')->where('created_at', '>=', $monthStart)->count(),
                'qualified' => Lead::has('studyPlans')->whereIn('status', ['Qualified', 'Processing'])->count(),
                'enrolled' => Lead::has('studyPlans')->where('status', 'Closed')->count(),
            ];

            $recentStudents = Lead::with('studyPlans')->has('studyPlans')
                ->latest()->limit(8)->get()->map(function ($l) {
                    return [
                        'id' => $l->id,
                        'lead_id' => $l->lead_id,
                        'name' => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
                        'email' => $l->email,
                        'course' => optional($l->studyPlans->first())->preferred_course,
                        'level' => optional($l->studyPlans->first())->preferred_level,
                        'status' => $l->status ?: 'New',
                        'created_at' => $l->created_at,
                    ];
                });

            $recentPrograms = Program::latest()->limit(6)->get(['id', 'title', 'slug', 'status', 'updated_at']);

            return inertia('portal/education/Dashboard', [
                'programStats' => $programStats,
                'studentStats' => $studentStats,
                'recentStudents' => $recentStudents,
                'recentPrograms' => $recentPrograms,
            ]);
        } catch (\Throwable $e) {
            Log::error('Education dashboard failed', ['error' => $e->getMessage()]);

            return inertia('portal/education/Dashboard', [
                'programStats' => array_fill_keys(['total', 'published', 'draft', 'archived'], 0),
                'studentStats' => array_fill_keys(['total_with_plan', 'this_month', 'qualified', 'enrolled'], 0),
                'recentStudents' => collect(),
                'recentPrograms' => collect(),
            ]);
        }
    }

    /**
     * Leads queue for the Education portal — same shape as Sales so the
     * Leads.jsx page renders identically. No server-side filtering yet;
     * the page's status filter + search lets users narrow to their own
     * department-relevant rows.
     */
    public function leads()
    {
        try {
            return inertia('portal/education/Leads', [
                'portal'   => 'education',
                'statuses' => self::LEAD_STATUSES,
                'leads'    => Lead::with(['studyPlans', 'event', 'portalUser:id,lead_id,last_login_at'])->latest()->get()->map(fn ($l) => $this->leadRow($l)),
            ]);
        } catch (\Throwable $e) {
            Log::error('Education leads list failed', ['error' => $e->getMessage()]);

            return inertia('portal/education/Leads', [
                'portal'   => 'education',
                'statuses' => self::LEAD_STATUSES,
                'leads'    => collect(),
            ]);
        }
    }

    public function updateLead(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(self::LEAD_STATUSES)],
        ]);

        try {
            $lead = Lead::findOrFail($id);
            $lead->status = $validated['status'];
            $lead->save();

            return back()->with('success', "Lead {$lead->lead_id} updated.");
        } catch (\Throwable $e) {
            Log::error('Education lead update failed', ['id' => $id, 'error' => $e->getMessage()]);

            return back()->with('error', 'Could not update that lead. Please try again.');
        }
    }
}
