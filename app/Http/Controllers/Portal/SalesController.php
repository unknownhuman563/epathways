<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Lead;
use App\Models\Program;
use App\Traits\BuildsLeadRow;
use App\Traits\CreatesDashboardLead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class SalesController extends Controller
{
    use BuildsLeadRow;
    use CreatesDashboardLead;

    // Unified lead-pipeline stages (merged from the old `status` + `stage`
    // concepts into one). Order matters — this is the canonical pipeline
    // order surfaced in the dropdown.
    private const LEAD_STATUSES = [
        'New Leads',
        'Contact Attempted',
        'Contacted for Booking',
        'Booking Confirmation with Bryll',
        'Missed the Meeting',
        'Qualified but Not Ready',
        'Qualified but No Funds',
        'Qualified',
        'Booked Consultation',
        'Did Not Book Consultation',
        'No Show',
        'Consultation Done',
        'Proposal Sent',
        'Consultancy Agreement',
        'English Pro',
        'School Enrollment',
        'Visa Process',
        'Not Qualified',
        'Work Pathway / Other',
    ];

    private const BOOKING_STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

    /** Sales overview: pipeline counts, 6-month trend, recent leads, upcoming consultations. */
    public function dashboard()
    {
        try {
            $now = now();
            $monthStart = $now->copy()->startOfMonth();
            $lastMonthStart = $monthStart->copy()->subMonths(1);

            $leadStats = [
                'total' => Lead::count(),
                'new' => Lead::where('status', 'New')->count(),
                'this_month' => Lead::where('created_at', '>=', $monthStart)->count(),
                'last_month' => Lead::whereBetween('created_at', [$lastMonthStart, $monthStart])->count(),
                'qualified' => Lead::whereIn('status', ['Qualified', 'Processing'])->count(),
                'closed' => Lead::where('status', 'Closed')->count(),
                'ai_done' => Lead::where('ai_analysis_status', 'completed')->count(),
                'ai_pending' => Lead::where('ai_analysis_status', 'processing')->count(),
            ];

            $bookingStats = [
                'total' => Booking::count(),
                'this_month' => Booking::where('created_at', '>=', $monthStart)->count(),
                'upcoming' => Booking::whereDate('appointment_date', '>=', $now->toDateString())->count(),
                'pending' => Booking::where('status', 'Pending')->count(),
            ];

            $leadsByMonth = collect(range(5, 0))->map(function ($i) use ($monthStart) {
                $m = $monthStart->copy()->subMonths($i);

                return [
                    'label' => $m->format('M'),
                    'count' => Lead::whereYear('created_at', $m->year)->whereMonth('created_at', $m->month)->count(),
                ];
            })->all();

            return inertia('portal/sales/Dashboard', [
                'portal' => 'sales',
                'leadStats' => $leadStats,
                'bookingStats' => $bookingStats,
                'leadsByMonth' => $leadsByMonth,
                'recentLeads' => Lead::with(['studyPlans', 'event'])->latest()->limit(8)->get()->map(fn ($l) => $this->leadRow($l)),
                'upcomingBookings' => Booking::with('lead')
                    ->whereDate('appointment_date', '>=', $now->toDateString())
                    ->orderBy('appointment_date')->orderBy('appointment_time')
                    ->limit(8)->get()->map(fn ($b) => $this->bookingRow($b)),
            ]);
        } catch (\Throwable $e) {
            Log::error('Sales dashboard failed', ['error' => $e->getMessage()]);

            return inertia('portal/sales/Dashboard', [
                'portal' => 'sales',
                'leadStats' => array_fill_keys(['total', 'new', 'this_month', 'last_month', 'qualified', 'closed', 'ai_done', 'ai_pending'], 0),
                'bookingStats' => array_fill_keys(['total', 'this_month', 'upcoming', 'pending'], 0),
                'leadsByMonth' => [],
                'recentLeads' => collect(),
                'upcomingBookings' => collect(),
            ]);
        }
    }

    /** Full leads list with inline status updates. */
    public function leads()
    {
        try {
            // Eager-load the latest pre-screen / goal-setting notes so the
            // index can render their summary chips and the expander panel
            // without triggering N+1. `tasks_open_count` is a custom alias
            // for incomplete tasks only.
            // Sales only sees leads still in the pipeline — once any
            // department adopts the lead (student / English / case /
            // accommodation) it disappears from this table.
            $leads = Lead::inLeadPipeline()
                ->with([
                    'studyPlans',
                    'event',
                    'portalUser:id,lead_id,last_login_at',
                    'notes' => fn ($q) => $q->latest(),
                ])
                ->withCount(['notes', 'documents'])
                ->withCount(['tasks as tasks_open_count' => fn ($q) => $q->where('completed', false)])
                ->latest()->get();

            return inertia('portal/sales/Leads', [
                'portal' => 'sales',
                'statuses' => self::LEAD_STATUSES,
                'programs' => Program::orderBy('title')->pluck('title')->filter()->values(),
                'staffOptions' => $this->dashboardStaff(),
                'leads' => $leads->map(fn ($l) => $this->leadRow($l)),
            ]);
        } catch (\Throwable $e) {
            Log::error('Sales leads list failed', ['error' => $e->getMessage()]);

            return inertia('portal/sales/Leads', ['portal' => 'sales', 'statuses' => self::LEAD_STATUSES, 'programs' => Program::orderBy('title')->pluck('title')->filter()->values(), 'staffOptions' => $this->dashboardStaff(), 'leads' => collect()]);
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
            Log::error('Sales add-lead failed', ['error' => $e->getMessage()]);

            return back()->with('error', 'Could not add that lead. Please try again.');
        }
    }

    public function updateLead(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(self::LEAD_STATUSES)],
            'stage' => 'nullable|string|max:120',
        ]);

        try {
            $lead = Lead::findOrFail($id);
            $lead->status = $validated['status'];
            $lead->stage = ! empty($validated['stage']) ? $validated['stage'] : $lead->stage;
            $lead->save();

            // Audited automatically by the LogsActivity trait on the Lead model.

            return back()->with('success', "Lead {$lead->lead_id} updated.");
        } catch (\Throwable $e) {
            Log::error('Lead update failed', ['id' => $id, 'error' => $e->getMessage()]);

            return back()->with('error', 'Could not update that lead. Please try again.');
        }
    }

    /**
     * Tasks & Follow-ups — every open + recently-completed task across
     * every lead, bucketed Today / This Week / Overdue / All so staff
     * can plan their day from one screen instead of opening each lead.
     */
    public function tasks(Request $request)
    {
        try {
            $userId = $request->user()->id;
            $scope = $request->input('scope', 'mine'); // mine | all
            $now = now();
            $todayEnd = $now->copy()->endOfDay();
            $weekEnd = $now->copy()->endOfWeek();

            $base = \App\Models\LeadTask::with(['lead:id,lead_id,first_name,last_name,email,status', 'assignee:id,name', 'creator:id,name', 'attachments'])
                ->withCount('comments')
                ->when($scope === 'mine', fn ($q) => $q->where('assignee_id', $userId))
                ->when($scope === 'department', fn ($q) => $q->where('department', 'sales'));

            $serialize = fn ($t) => [
                'id' => $t->id,
                'title' => $t->title,
                'description' => $t->description,
                'note' => $t->note,
                'comments_count' => (int) ($t->comments_count ?? 0),
                'priority' => $t->priority,
                'progress' => (int) ($t->progress ?? 0),
                'due_at' => $t->due_at,
                'completed' => $t->completed,
                'completed_at' => $t->completed_at,
                'overdue' => ! $t->completed && $t->due_at && $t->due_at->isPast(),
                'type' => $t->type,
                'category' => $t->category,
                'department' => $t->department,
                'tags' => $t->tags,
                'status' => $t->status,
                'completion_notes' => $t->completion_notes,
                'attachments' => $t->attachments->map(fn ($a) => [
                    'id' => $a->id,
                    'url' => $a->url,
                    'original_filename' => $a->original_filename,
                    'is_image' => $a->is_image,
                    'mime_type' => $a->mime_type,
                    'size' => $a->size,
                ])->values(),
                'assignee' => $t->assignee ? ['id' => $t->assignee->id, 'name' => $t->assignee->name] : null,
                'additional_assignee_ids' => $t->additional_assignee_ids ?? [],
                'additional_lead_ids' => $t->additional_lead_ids ?? [],
                'creator' => $t->creator ? ['id' => $t->creator->id, 'name' => $t->creator->name] : null,
                'lead' => $t->lead ? [
                    'id' => $t->lead->id,
                    'lead_id' => $t->lead->lead_id,
                    'name' => trim("{$t->lead->first_name} {$t->lead->last_name}"),
                    'status' => $t->lead->status,
                ] : null,
            ];

            // Full task set for the kanban (all dates, all statuses).
            $allTasks = (clone $base)->orderByDesc('created_at')->limit(1000)->get()->map($serialize);
            $today = (clone $base)->where('completed', false)->whereBetween('due_at', [$now, $todayEnd])->orderBy('due_at')->get()->map($serialize);
            $overdue = (clone $base)->where('completed', false)->whereNotNull('due_at')->where('due_at', '<', $now)->orderBy('due_at')->get()->map($serialize);
            $thisWeek = (clone $base)->where('completed', false)->whereBetween('due_at', [$todayEnd, $weekEnd])->orderBy('due_at')->get()->map($serialize);
            $undated = (clone $base)->where('completed', false)->whereNull('due_at')->orderByDesc('created_at')->limit(50)->get()->map($serialize);
            $recentlyDone = (clone $base)->where('completed', true)->orderByDesc('completed_at')->limit(20)->get()->map($serialize);

            return inertia('portal/sales/Tasks', [
                'portal' => 'sales',
                'scope' => $scope,
                'all_tasks' => $allTasks,
                'today' => $today,
                'overdue' => $overdue,
                'this_week' => $thisWeek,
                'undated' => $undated,
                'recently_done' => $recentlyDone,
                'staffOptions' => \App\Models\User::whereNotIn('role', ['lead', 'revoked_lead'])->orderBy('name')->get(['id', 'name', 'role']),
                'recent_activity' => \App\Models\ActivityLog::where('action', 'like', 'lead_task.%')
                    ->latest()->limit(30)
                    ->get(['id', 'action', 'description', 'actor_name', 'actor_role', 'properties', 'created_at']),
            ]);
        } catch (\Throwable $e) {
            Log::error('Sales tasks page failed', ['error' => $e->getMessage()]);

            return inertia('portal/sales/Tasks', ['portal' => 'sales', 'scope' => 'mine', 'today' => [], 'overdue' => [], 'this_week' => [], 'undated' => [], 'recently_done' => [], 'staffOptions' => []]);
        }
    }

    /**
     * Sales Weekly Report — 11 sections per spec. Sections backed by real
     * data we have today; ones that need new infra (AI tracking, lead
     * assignment, sales targets) return null so the frontend renders a
     * "needs infra" placeholder.
     */
    public function report(Request $request)
    {
        try {
            // Week anchor — default to the current ISO week. URL query
            // `?week_start=YYYY-MM-DD` lets the selector jump around.
            $weekStart = $request->filled('week_start')
                ? \Illuminate\Support\Carbon::parse($request->input('week_start'))->startOfDay()
                : now()->startOfWeek();
            $weekEnd = $weekStart->copy()->endOfWeek();
            $prevStart = $weekStart->copy()->subWeek();
            $prevEnd = $weekEnd->copy()->subWeek();

            // ── Section 1 — Week at a glance ───────────────────────────
            $newLeads = Lead::whereBetween('created_at', [$weekStart, $weekEnd])->count();
            $newLeadsPrev = Lead::whereBetween('created_at', [$prevStart, $prevEnd])->count();

            $convertedStages = ['Consultancy Agreement', 'English Pro', 'School Enrollment', 'Visa Process'];
            $converted = Lead::whereIn('status', $convertedStages)
                ->whereBetween('updated_at', [$weekStart, $weekEnd])->count();
            $convertedPrev = Lead::whereIn('status', $convertedStages)
                ->whereBetween('updated_at', [$prevStart, $prevEnd])->count();

            $conversionRate = $newLeads > 0 ? round(($converted / $newLeads) * 100, 1) : 0;
            $conversionRatePrev = $newLeadsPrev > 0 ? round(($convertedPrev / $newLeadsPrev) * 100, 1) : 0;

            $lostStages = ['Not Qualified', 'Did Not Book Consultation', 'No Show'];
            $lost = Lead::whereIn('status', $lostStages)
                ->whereBetween('updated_at', [$weekStart, $weekEnd])->count();
            $topLostStage = Lead::whereIn('status', $lostStages)
                ->whereBetween('updated_at', [$weekStart, $weekEnd])
                ->selectRaw('status, COUNT(*) as c')
                ->groupBy('status')
                ->orderByDesc('c')
                ->value('status');

            // Cold leads = no update in 14+ days, still in open stages.
            $openStages = collect(Lead::STAGES)
                ->diff(array_merge($convertedStages, $lostStages, ['Work Pathway / Other']))
                ->values()->all();
            $cold14 = Lead::whereIn('status', $openStages)->where('updated_at', '<', now()->subDays(14))->count();
            $cold7to14 = Lead::whereIn('status', $openStages)->whereBetween('updated_at', [now()->subDays(14), now()->subDays(7)])->count();
            $cold30 = Lead::whereIn('status', $openStages)->where('updated_at', '<', now()->subDays(30))->count();

            // ── Section 2 — Pipeline health ─────────────────────────────
            $byStageRaw = Lead::selectRaw('status, COUNT(*) as c')
                ->whereNotNull('status')
                ->groupBy('status')
                ->pluck('c', 'status')
                ->all();
            $byStage = collect(Lead::STAGES)->map(fn ($s) => [
                'stage' => $s,
                'count' => (int) ($byStageRaw[$s] ?? 0),
                'bucket' => $this->stageBucket($s),
            ])->all();

            // Aging — leads stuck in same stage 7+ / 14+ / 30+ days.
            $aging = [
                'stuck_7' => Lead::whereIn('status', $openStages)->where('updated_at', '<', now()->subDays(7))->count(),
                'stuck_14' => Lead::whereIn('status', $openStages)->where('updated_at', '<', now()->subDays(14))->count(),
                'stuck_30' => Lead::whereIn('status', $openStages)->where('updated_at', '<', now()->subDays(30))->count(),
            ];

            // ── Section 5 — Lead sources ────────────────────────────────
            $bySource = Lead::whereBetween('created_at', [$weekStart, $weekEnd])
                ->selectRaw("COALESCE(source, 'Unknown') as source, COUNT(*) as c")
                ->groupBy('source')->orderByDesc('c')->limit(8)
                ->get()->map(fn ($r) => ['label' => $this->prettifySource((string) $r->source), 'count' => (int) $r->c])->all();

            // ── Section 6 — Bookings & meetings ─────────────────────────
            $bookings = [
                'booked_this_week' => Booking::whereBetween('created_at', [$weekStart, $weekEnd])->count(),
                'completed_this_week' => Booking::where('status', 'Completed')->whereBetween('updated_at', [$weekStart, $weekEnd])->count(),
                'no_shows_this_week' => Booking::whereIn('status', ['No Show', 'Cancelled'])->whereBetween('updated_at', [$weekStart, $weekEnd])->count(),
                'cancelled_this_week' => Booking::where('status', 'Cancelled')->whereBetween('updated_at', [$weekStart, $weekEnd])->count(),
                'scheduled_next_week' => Booking::whereBetween('appointment_date', [$weekStart->copy()->addWeek(), $weekEnd->copy()->addWeek()])->count(),
            ];

            // ── Section 7 — Lost analysis ───────────────────────────────
            $lostBreakdown = Lead::whereIn('status', $lostStages)
                ->whereBetween('updated_at', [$weekStart, $weekEnd])
                ->selectRaw('status, COUNT(*) as c')
                ->groupBy('status')->orderByDesc('c')
                ->get()->map(fn ($r) => ['label' => $r->status, 'count' => (int) $r->c])->all();
            $lostBySource = Lead::whereIn('status', $lostStages)
                ->whereBetween('updated_at', [$weekStart, $weekEnd])
                ->selectRaw("COALESCE(source, 'Unknown') as source, COUNT(*) as c")
                ->groupBy('source')->orderByDesc('c')->limit(6)
                ->get()->map(fn ($r) => ['label' => $this->prettifySource((string) $r->source), 'count' => (int) $r->c])->all();

            // ── Section 9 — 8-week trend ───────────────────────────────
            $trend = [];
            for ($i = 7; $i >= 0; $i--) {
                $wStart = now()->copy()->startOfWeek()->subWeeks($i);
                $wEnd = $wStart->copy()->endOfWeek();
                $trend[] = [
                    'label' => $wStart->format('d M'),
                    'new_leads' => Lead::whereBetween('created_at', [$wStart, $wEnd])->count(),
                    'conversions' => Lead::whereIn('status', $convertedStages)->whereBetween('updated_at', [$wStart, $wEnd])->count(),
                    'active' => Lead::whereIn('status', $openStages)->whereBetween('created_at', [$wStart, $wEnd])->count(),
                ];
            }

            return inertia('portal/sales/Reports', [
                'portal' => 'sales',
                'week_start' => $weekStart->toDateString(),
                'week_end' => $weekEnd->toDateString(),

                'glance' => [
                    'new_leads' => ['value' => $newLeads,          'prev' => $newLeadsPrev],
                    'converted' => ['value' => $converted,         'prev' => $convertedPrev],
                    'conversion_rate' => ['value' => $conversionRate,    'prev' => $conversionRatePrev],
                    'lost' => ['value' => $lost,              'top_reason' => $topLostStage],
                    'avg_response_time_hrs' => null, // needs first-touch tracking
                    'cold_actioned' => null, // needs cold-action audit
                ],
                'pipeline' => [
                    'by_stage' => $byStage,
                    'stage_dropoff' => null, // needs transition audit (we have it, can add later)
                    'aging' => $aging,
                ],
                'cold_buckets' => [
                    '7_to_14' => $cold7to14,
                    '15_to_30' => max(0, $cold14 - $cold30),
                    '30_plus' => $cold30,
                ],
                'per_agent' => null, // needs assignee_id on Lead
                'by_source' => $bySource,
                'bookings' => $bookings,
                'lost_analysis' => [
                    'total' => $lost,
                    'breakdown' => $lostBreakdown,
                    'by_source' => $lostBySource,
                ],
                'ai_activity' => null, // needs AI activity tracking
                'trend' => $trend,
                'notable' => [
                    'wins' => $this->reportWins($weekStart, $weekEnd, $convertedStages),
                    'concerns' => $this->reportConcerns($openStages),
                ],
                'generated_at' => now()->toIso8601String(),
                'generated_by' => optional(auth()->user())->name,
            ]);
        } catch (\Throwable $e) {
            Log::error('Sales report failed', ['error' => $e->getMessage()]);

            return inertia('portal/sales/Reports', ['portal' => 'sales', 'error' => 'Could not build the report.']);
        }
    }

    /** Group a stage into one of 4 visual buckets for the pipeline chart. */
    private function stageBucket(string $stage): string
    {
        if (in_array($stage, ['New Leads', 'Contact Attempted', 'Contacted for Booking', 'Booking Confirmation with Bryll', 'Missed the Meeting'], true)) {
            return 'Early';
        }
        if (in_array($stage, ['Qualified but Not Ready', 'Qualified but No Funds', 'Qualified', 'Booked Consultation', 'Did Not Book Consultation', 'No Show', 'Consultation Done'], true)) {
            return 'Nurture';
        }
        if (in_array($stage, ['Proposal Sent', 'Consultancy Agreement', 'English Pro', 'School Enrollment', 'Visa Process'], true)) {
            return 'Qualified';
        }

        return 'Closed';
    }

    private function reportWins(\Carbon\Carbon $weekStart, \Carbon\Carbon $weekEnd, array $convertedStages): array
    {
        return Lead::whereIn('status', $convertedStages)
            ->whereBetween('updated_at', [$weekStart, $weekEnd])
            ->orderByDesc('updated_at')->limit(5)
            ->get()->map(fn ($l) => [
                'name' => trim("{$l->first_name} {$l->last_name}") ?: $l->lead_id,
                'detail' => "Moved to {$l->status}",
                'when' => optional($l->updated_at)->toIso8601String(),
                'href' => "/admin/leads/{$l->id}",
            ])->all();
    }

    private function reportConcerns(array $openStages): array
    {
        return Lead::whereIn('status', $openStages)
            ->where('updated_at', '<', now()->subDays(30))
            ->orderBy('updated_at')->limit(5)
            ->get()->map(fn ($l) => [
                'name' => trim("{$l->first_name} {$l->last_name}") ?: $l->lead_id,
                'detail' => "Stuck in {$l->status} for ".(int) optional($l->updated_at)->diffInDays(now()).' days',
                'when' => optional($l->updated_at)->toIso8601String(),
                'href' => "/admin/leads/{$l->id}",
            ])->all();
    }

    public function campaigns()
    {
        return inertia('portal/sales/Campaigns', ['portal' => 'sales']);
    }

    public function profile()
    {
        return inertia('portal/sales/Profile', ['portal' => 'sales', 'user' => auth()->user()->only(['id', 'name', 'email', 'role'])]);
    }

    /**
     * Sales assessments queue — same Free Assessment + Education Enrolment
     * submissions Education sees, but rendered under SalesLayout via a thin
     * re-export at pages/portal/sales/Assessments.jsx.
     */
    public function assessments()
    {
        return inertia('portal/sales/Assessments', [
            'portal' => 'sales',
            'eligibility' => $this->assessmentRows('free-assessment'),
            'enrolment' => $this->assessmentRows('education-enrolment'),
        ]);
    }

    private function assessmentRows(string $source)
    {
        return \App\Models\Lead::query()
            ->where('source', $source)
            ->orderByDesc('updated_at')
            ->limit(200)
            ->get()
            ->map(function (\App\Models\Lead $l) {
                $analysis = is_array($l->ai_analysis) ? $l->ai_analysis : [];
                $sp = $analysis['study_plans'] ?? [];

                return [
                    'id' => $l->id,
                    'lead_id' => $l->lead_id,
                    'name' => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
                    'email' => $l->email,
                    'phone' => $l->phone,
                    'country' => $l->country,
                    'status' => $l->status,
                    'stage' => $l->stage,
                    'created_at' => $l->created_at,
                    'updated_at' => $l->updated_at,
                    'programme' => $sp['preferred_course'] ?? null,
                    'level' => $sp['qualification_level'] ?? null,
                    'intake' => $sp['preferred_intake'] ?? null,
                    'analysis_done' => $l->ai_analysis_status === 'completed',
                    'detail_url' => "/portal/sales/leads/{$l->id}",
                ];
            });
    }

    /** Consultation bookings with inline scheduling + status updates. */
    public function bookings()
    {
        try {
            return inertia('portal/sales/Bookings', [
                'portal' => 'sales',
                'statuses' => self::BOOKING_STATUSES,
                'bookings' => Booking::with('lead')->latest()->get()->map(fn ($b) => $this->bookingRow($b)),
            ]);
        } catch (\Throwable $e) {
            Log::error('Sales bookings list failed', ['error' => $e->getMessage()]);

            return inertia('portal/sales/Bookings', ['portal' => 'sales', 'statuses' => self::BOOKING_STATUSES, 'bookings' => collect()]);
        }
    }

    public function updateBooking(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::in(self::BOOKING_STATUSES)],
            'appointment_date' => 'nullable|date',
            'appointment_time' => 'nullable|string|max:50',
            'consultant_name' => 'nullable|string|max:120',
        ]);

        try {
            $booking = Booking::findOrFail($id);
            $booking->update($validated);

            // Audited automatically by the LogsActivity trait on the Booking model.

            return back()->with('success', "Booking #{$booking->id} updated.");
        } catch (\Throwable $e) {
            Log::error('Booking update failed', ['id' => $id, 'error' => $e->getMessage()]);

            return back()->with('error', 'Could not update that booking. Please try again.');
        }
    }

    private function bookingRow(Booking $b): array
    {
        return [
            'id' => $b->id,
            'name' => trim("{$b->first_name} {$b->last_name}") ?: 'Unknown',
            'email' => $b->email,
            'phone' => $b->phone,
            'service_type' => $b->service_type,
            'consultant_name' => $b->consultant_name,
            'platform' => $b->platform,
            'current_country' => $b->current_country,
            'status' => $b->status ?: 'Pending',
            'appointment_date' => $b->appointment_date ? \Illuminate\Support\Carbon::parse($b->appointment_date)->toDateString() : null,
            'appointment_time' => $b->appointment_time,
            'message' => $b->message,
            'lead_ref' => optional($b->lead)->lead_id,
            'created_at' => $b->created_at,
        ];
    }
}
