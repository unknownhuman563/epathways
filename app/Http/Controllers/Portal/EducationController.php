<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Program;
use App\Traits\BuildsLeadRow;
use App\Traits\CreatesDashboardLead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class EducationController extends Controller
{
    use BuildsLeadRow;
    use CreatesDashboardLead;

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
            $leads = Lead::with([
                'studyPlans',
                'event',
                'portalUser:id,lead_id,last_login_at',
                'notes' => fn ($q) => $q->latest(),
            ])
                ->withCount(['notes', 'documents'])
                ->withCount(['tasks as tasks_open_count' => fn ($q) => $q->where('completed', false)])
                ->latest()->get();

            return inertia('portal/education/Leads', [
                'portal'   => 'education',
                'statuses' => self::LEAD_STATUSES,
                'programs' => Program::orderBy('title')->pluck('title')->filter()->values(),
                'staffOptions' => $this->dashboardStaff(),
                'leads'    => $leads->map(fn ($l) => $this->leadRow($l)),
            ]);
        } catch (\Throwable $e) {
            Log::error('Education leads list failed', ['error' => $e->getMessage()]);

            return inertia('portal/education/Leads', [
                'portal'   => 'education',
                'statuses' => self::LEAD_STATUSES,
                'programs' => Program::orderBy('title')->pluck('title')->filter()->values(),
                'staffOptions' => $this->dashboardStaff(),
                'leads'    => collect(),
            ]);
        }
    }

    /** Manually add a lead from the dashboard "Add Lead" form. */
    public function storeLead(Request $request)
    {
        $validated = $request->validate($this->dashboardLeadRules(self::LEAD_STATUSES));

        try {
            $lead = $this->createDashboardLead($validated);

            return back()->with('success', "Lead {$lead->lead_id} added.");
        } catch (\Throwable $e) {
            Log::error('Education add-lead failed', ['error' => $e->getMessage()]);

            return back()->with('error', 'Could not add that lead. Please try again.');
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

    /**
     * Students — engaged leads with a study plan or in any post-engagement
     * stage. The Leads page covers prospecting; this is the "in-flight" view.
     */
    public function students()
    {
        try {
            // Students are leads explicitly flipped via "Convert to Student"
            // on the lead detail page. The flag is the source of truth — no
            // more guessing from status or study plans.
            $students = Lead::with(['studyPlans', 'documents'])
                ->where('is_student', true)
                ->orderByDesc('student_converted_at')
                ->limit(200)
                ->get()
                ->map(fn ($l) => [
                    'id'       => $l->id,
                    'lead_id'  => $l->lead_id,
                    'name'     => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
                    'email'    => $l->email,
                    'status'   => $l->status,
                    'program'  => optional($l->studyPlans->first())->preferred_course,
                    'level'    => optional($l->studyPlans->first())->qualification_level,
                    'docs_total'    => $l->documents->count(),
                    'docs_approved' => $l->documents->where('status', 'Approved')->count(),
                ]);

            return inertia('portal/education/Students', ['portal' => 'education', 'students' => $students]);
        } catch (\Throwable $e) {
            Log::error('Education students list failed', ['error' => $e->getMessage()]);
            return inertia('portal/education/Students', ['portal' => 'education', 'students' => collect()]);
        }
    }

    /**
     * Documents — Queue view (what needs my attention) + Folders view
     * (every student's folder with completion progress).
     */
    public function documents()
    {
        try {
            $pending = \App\Models\LeadDocument::with('lead:id,first_name,last_name,lead_id')
                ->whereIn('status', ['Submitted', 'UnderReview'])
                ->orderBy('created_at')
                ->limit(50)
                ->get()
                ->map(fn ($d) => $this->docQueueRow($d, 'pending'));

            $stale = \App\Models\LeadDocument::with('lead:id,first_name,last_name,lead_id')
                ->where('status', 'Submitted')
                ->where('created_at', '<', now()->subDays(7))
                ->orderBy('created_at')
                ->limit(30)
                ->get()
                ->map(fn ($d) => $this->docQueueRow($d, 'stale'));

            $rejected = \App\Models\LeadDocument::with('lead:id,first_name,last_name,lead_id')
                ->where('status', 'Rejected')
                ->where('reviewed_at', '>', now()->subDays(14))
                ->orderByDesc('reviewed_at')
                ->limit(30)
                ->get()
                ->map(fn ($d) => $this->docQueueRow($d, 'rejected'));

            // Folders — every lead with at least one document, with progress.
            $folders = Lead::has('documents')
                ->with('documents:id,lead_id,status,checklist_key')
                ->orderBy('first_name')
                ->limit(200)
                ->get()
                ->map(fn ($l) => [
                    'id'       => $l->id,
                    'lead_id'  => $l->lead_id,
                    'name'     => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
                    'total'    => $l->documents->count(),
                    'approved' => $l->documents->where('status', 'Approved')->count(),
                    'pending'  => $l->documents->whereIn('status', ['Submitted', 'UnderReview'])->count(),
                    'rejected' => $l->documents->where('status', 'Rejected')->count(),
                ]);

            return inertia('portal/education/Documents', [
                'portal'   => 'education',
                'pending'  => $pending,
                'stale'    => $stale,
                'rejected' => $rejected,
                'folders'  => $folders,
            ]);
        } catch (\Throwable $e) {
            Log::error('Education documents page failed', ['error' => $e->getMessage()]);
            return inertia('portal/education/Documents', ['portal' => 'education', 'pending' => [], 'stale' => [], 'rejected' => [], 'folders' => []]);
        }
    }

    private function docQueueRow($d, $bucket): array
    {
        return [
            'id'            => $d->id,
            'bucket'        => $bucket,
            'original_name' => $d->original_name,
            'status'        => $d->status,
            'note'          => $d->note,
            'created_at'    => $d->created_at,
            'reviewed_at'   => $d->reviewed_at,
            'checklist_key' => $d->checklist_key,
            'lead' => $d->lead ? [
                'id'      => $d->lead->id,
                'lead_id' => $d->lead->lead_id,
                'name'    => trim("{$d->lead->first_name} {$d->lead->last_name}") ?: 'Unknown',
            ] : null,
        ];
    }

    // Stubs — these get real content as we build each feature out.
    public function checklistTemplates(){ return inertia('portal/education/ChecklistTemplates', ['portal' => 'education']); }

    /** Programs the Education team advises on — same catalogue admin manages. */
    public function programs()
    {
        try {
            $programs = Program::orderBy('title')->get()->map(fn ($p) => [
                'id'              => $p->id,
                'title'           => $p->title,
                'slug'            => $p->slug,
                'institution'     => $p->institution,
                'location'        => $p->location,
                'level'           => $p->level,
                'category'        => $p->category,
                'status'          => $p->status,
                'duration_months' => $p->duration_months,
                'intake_months'   => $p->intake_months,
                'price_text'      => $p->price_text,
                'enrolled'        => Lead::whereHas('studyPlans', fn ($q) => $q->where('preferred_course', $p->title))->count(),
            ]);

            return inertia('portal/education/Programs', [
                'portal'   => 'education',
                'programs' => $programs,
            ]);
        } catch (\Throwable $e) {
            Log::error('Education programs page failed', ['error' => $e->getMessage()]);
            return inertia('portal/education/Programs', ['portal' => 'education', 'programs' => collect()]);
        }
    }
    /**
     * Single Reports page — period is a query param (weekly / monthly /
     * quarterly / custom). All 13 sections render regardless; only the
     * data underneath changes. Filters (counselor / institution / intake
     * / program) also come in via query so they persist across tab clicks.
     */
    public function reports(Request $request)
    {
        $period = $request->input('period', 'weekly');
        $period = in_array($period, ['weekly', 'monthly', 'quarterly', 'custom'], true) ? $period : 'weekly';

        // Anchor + range per period. Custom takes from/to as ISO dates.
        $now = now();
        switch ($period) {
            case 'monthly':
                $start = $request->filled('anchor') ? \Illuminate\Support\Carbon::parse($request->input('anchor'))->startOfMonth() : $now->copy()->startOfMonth();
                $end   = $start->copy()->endOfMonth();
                $prevStart = $start->copy()->subMonth();
                $prevEnd   = $prevStart->copy()->endOfMonth();
                break;
            case 'quarterly':
                $start = $request->filled('anchor') ? \Illuminate\Support\Carbon::parse($request->input('anchor'))->startOfQuarter() : $now->copy()->startOfQuarter();
                $end   = $start->copy()->endOfQuarter();
                $prevStart = $start->copy()->subQuarter();
                $prevEnd   = $prevStart->copy()->endOfQuarter();
                break;
            case 'custom':
                $start = $request->filled('from') ? \Illuminate\Support\Carbon::parse($request->input('from'))->startOfDay() : $now->copy()->subDays(30)->startOfDay();
                $end   = $request->filled('to')   ? \Illuminate\Support\Carbon::parse($request->input('to'))->endOfDay()    : $now->copy()->endOfDay();
                $prevSpan = $end->diffInDays($start) + 1;
                $prevStart = $start->copy()->subDays($prevSpan);
                $prevEnd   = $start->copy()->subDay()->endOfDay();
                break;
            case 'weekly':
            default:
                $start = $request->filled('anchor') ? \Illuminate\Support\Carbon::parse($request->input('anchor'))->startOfWeek() : $now->copy()->startOfWeek();
                $end   = $start->copy()->endOfWeek();
                $prevStart = $start->copy()->subWeek();
                $prevEnd   = $prevStart->copy()->endOfWeek();
        }

        try {
            // Real-data sections.
            $newStudents  = Lead::where('is_student', true)->whereBetween('student_converted_at', [$start, $end])->count();
            $newStudentsPrev = Lead::where('is_student', true)->whereBetween('student_converted_at', [$prevStart, $prevEnd])->count();

            $totalStudents = Lead::where('is_student', true)->count();

            // Document throughput
            $docsApproved   = \App\Models\LeadDocument::where('status', 'Approved')->whereBetween('reviewed_at', [$start, $end])->count();
            $docsRejected   = \App\Models\LeadDocument::where('status', 'Rejected')->whereBetween('reviewed_at', [$start, $end])->count();
            $docsPending    = \App\Models\LeadDocument::whereIn('status', ['Submitted', 'UnderReview'])->count();
            $docsUploaded   = \App\Models\LeadDocument::whereBetween('created_at', [$start, $end])->count();

            // Programs & institutions — quick snapshot
            $programCount   = \App\Models\Program::count();
            $publishedProgs = \App\Models\Program::where('status', 'published')->count();

            // 8-period trend (weeks / months / quarters / days for custom)
            $trend = $this->buildEducationTrend($period, $start);

            return inertia('portal/education/Reports', [
                'portal'        => 'education',
                'period'        => $period,
                'range'         => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
                'filters'       => $request->only(['counselor', 'institution', 'intake', 'program']),

                'glance' => [
                    'new_students'   => ['value' => $newStudents, 'prev' => $newStudentsPrev],
                    'total_students' => $totalStudents,
                    'docs_approved'  => $docsApproved,
                    'docs_rejected'  => $docsRejected,
                    'docs_pending'   => $docsPending,
                    'docs_uploaded'  => $docsUploaded,
                ],
                'programs' => [
                    'total'     => $programCount,
                    'published' => $publishedProgs,
                ],
                'trend' => $trend,
                'generated_at' => now()->toIso8601String(),
                'generated_by' => optional(auth()->user())->name,
            ]);
        } catch (\Throwable $e) {
            Log::error('Education reports failed', ['error' => $e->getMessage()]);
            return inertia('portal/education/Reports', [
                'portal' => 'education',
                'period' => $period,
                'error'  => 'Could not build the report.',
            ]);
        }
    }

    /** Build a period-appropriate trend array (8 buckets). */
    private function buildEducationTrend(string $period, \Carbon\Carbon $anchor): array
    {
        $points = [];
        for ($i = 7; $i >= 0; $i--) {
            $b = $anchor->copy();
            switch ($period) {
                case 'monthly':
                    $b->subMonths($i);  $start = $b->copy()->startOfMonth();  $end = $b->copy()->endOfMonth();  $label = $b->format('M Y'); break;
                case 'quarterly':
                    $b->subQuarters($i);$start = $b->copy()->startOfQuarter();$end = $b->copy()->endOfQuarter();$label = 'Q' . $b->quarter . ' ' . $b->year; break;
                case 'custom':
                    // For custom, just emit 8 equal slices of the range — best-effort.
                    $start = $anchor->copy()->subDays($i * 7);
                    $end   = $start->copy()->addDays(6);
                    $label = $start->format('d M');
                    break;
                case 'weekly':
                default:
                    $b->subWeeks($i);   $start = $b->copy()->startOfWeek();   $end = $b->copy()->endOfWeek();   $label = $start->format('d M');
            }
            $points[] = [
                'label'        => $label,
                'new_students' => Lead::where('is_student', true)->whereBetween('student_converted_at', [$start, $end])->count(),
                'docs_uploaded'=> \App\Models\LeadDocument::whereBetween('created_at', [$start, $end])->count(),
                'docs_approved'=> \App\Models\LeadDocument::where('status', 'Approved')->whereBetween('reviewed_at', [$start, $end])->count(),
            ];
        }
        return $points;
    }
    public function profile()           { return inertia('portal/education/Profile',  ['portal' => 'education', 'user' => auth()->user()->only(['id','name','email','role'])]); }
    public function notifications()     { return inertia('portal/education/Notifications', ['portal' => 'education']); }

    /**
     * Tasks & follow-ups across every lead, bucketed Today / This Week /
     * Overdue / All. Mirrors SalesController::tasks — same data, same
     * serialisation. Rendered via the shared Tasks page (Education portal
     * re-exports the sales component verbatim).
     */
    public function tasks(Request $request)
    {
        try {
            $userId   = $request->user()->id;
            $scope    = $request->input('scope', 'mine');
            $now      = now();
            $todayEnd = $now->copy()->endOfDay();
            $weekEnd  = $now->copy()->endOfWeek();

            $base = \App\Models\LeadTask::with(['lead:id,lead_id,first_name,last_name,email,status', 'assignee:id,name', 'attachments'])
                ->withCount('comments')
                ->when($scope === 'mine', fn ($q) => $q->where('assignee_id', $userId));

            $serialize = fn ($t) => [
                'id'           => $t->id,
                'title'        => $t->title,
                'note'         => $t->note,
                'comments_count' => (int) ($t->comments_count ?? 0),
                'priority'     => $t->priority,
                'progress'     => (int) ($t->progress ?? 0),
                'due_at'       => $t->due_at,
                'completed'    => $t->completed,
                'completed_at' => $t->completed_at,
                'overdue'      => ! $t->completed && $t->due_at && $t->due_at->isPast(),
                'type'         => $t->type,
                'category'     => $t->category,
                'department'   => $t->department,
                'tags'         => $t->tags,
                'status'       => $t->status,
                'completion_notes' => $t->completion_notes,
                'attachments'  => $t->attachments->map(fn ($a) => [
                    'id'                => $a->id,
                    'url'               => $a->url,
                    'original_filename' => $a->original_filename,
                    'is_image'          => $a->is_image,
                ])->values(),
                'assignee'     => $t->assignee ? ['id' => $t->assignee->id, 'name' => $t->assignee->name] : null,
                'lead'         => $t->lead ? [
                    'id'      => $t->lead->id,
                    'lead_id' => $t->lead->lead_id,
                    'name'    => trim("{$t->lead->first_name} {$t->lead->last_name}"),
                    'status'  => $t->lead->status,
                ] : null,
            ];

            // Full task set for the kanban (all dates, all statuses) — the
            // bucket queries below are kept for the legacy list view.
            $allTasks     = (clone $base)->orderByDesc('created_at')->limit(1000)->get()->map($serialize);
            $today        = (clone $base)->where('completed', false)->whereBetween('due_at', [$now, $todayEnd])->orderBy('due_at')->get()->map($serialize);
            $overdue      = (clone $base)->where('completed', false)->whereNotNull('due_at')->where('due_at', '<', $now)->orderBy('due_at')->get()->map($serialize);
            $thisWeek     = (clone $base)->where('completed', false)->whereBetween('due_at', [$todayEnd, $weekEnd])->orderBy('due_at')->get()->map($serialize);
            $undated      = (clone $base)->where('completed', false)->whereNull('due_at')->orderByDesc('created_at')->limit(50)->get()->map($serialize);
            $recentlyDone = (clone $base)->where('completed', true)->orderByDesc('completed_at')->limit(20)->get()->map($serialize);

            return inertia('portal/education/Tasks', [
                'portal'        => 'education',
                'scope'         => $scope,
                'all_tasks'     => $allTasks,
                'today'         => $today,
                'overdue'       => $overdue,
                'this_week'     => $thisWeek,
                'undated'       => $undated,
                'recently_done' => $recentlyDone,
                'staffOptions'  => \App\Models\User::whereNotIn('role', ['lead', 'revoked_lead'])->orderBy('name')->get(['id', 'name', 'role']),
            ]);
        } catch (\Throwable $e) {
            Log::error('Education tasks page failed', ['error' => $e->getMessage()]);
            return inertia('portal/education/Tasks', ['portal' => 'education', 'scope' => 'mine', 'today' => [], 'overdue' => [], 'this_week' => [], 'undated' => [], 'recently_done' => [], 'staffOptions' => []]);
        }
    }
}
