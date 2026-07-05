<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Lead;
use App\Models\LeadTask;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Top-of-the-house overview for the super-admin role. Aggregates four
 * cross-department panels (pipeline funnel, task health, bookings &
 * assessments, activity feed) into a single Inertia page. Every query
 * here is read-only — this controller is purely a read view.
 */
class SuperAdminDashboardController extends Controller
{
    public function dashboard()
    {
        $now          = Carbon::now();
        $thirtyDays   = $now->copy()->subDays(30);
        $sevenDays    = $now->copy()->subDays(7);
        $weekStart    = $now->copy()->startOfWeek();
        $weekEnd      = $now->copy()->endOfWeek();
        $today        = $now->copy()->startOfDay();
        $tomorrow     = $now->copy()->startOfDay()->addDay();

        // ── PIPELINE & FUNNEL ────────────────────────────────────────
        // Stage counts: one row per canonical pipeline stage (zero-filled
        // for stages with no leads so the funnel keeps its shape).
        $stageCountsRaw = Lead::query()
            ->select('stage', DB::raw('COUNT(*) as total'))
            ->whereNotNull('stage')
            ->groupBy('stage')
            ->pluck('total', 'stage');

        $pipeline = collect(Lead::STAGES)
            ->map(fn ($stage) => [
                'stage' => $stage,
                'count' => (int) ($stageCountsRaw[$stage] ?? 0),
            ])
            ->values();

        $totalLeads      = Lead::count();
        $newLeads30Days  = Lead::where('created_at', '>=', $thirtyDays)->count();
        $newLeads7Days   = Lead::where('created_at', '>=', $sevenDays)->count();
        $convertedTotal  = Lead::where('is_student', true)
            ->orWhere('is_immigration_case', true)
            ->orWhere('is_accommodation_client', true)
            ->count();

        // Source breakdown — drop nulls so the chart isn't dominated by
        // a phantom "Unknown" slice; sort by volume.
        $sources = Lead::query()
            ->select('source', DB::raw('COUNT(*) as total'))
            ->whereNotNull('source')
            ->where('source', '!=', '')
            ->groupBy('source')
            ->orderByDesc('total')
            ->limit(6)
            ->get()
            ->map(fn ($r) => ['source' => $r->source, 'count' => (int) $r->total]);

        // AI eligibility — bucket the CerebrasService score (0-100) into
        // five tiers. The score lives in leads.ai_analysis JSON column.
        $aiBuckets = ['85+' => 0, '70-84' => 0, '50-69' => 0, '30-49' => 0, '<30' => 0];
        Lead::whereNotNull('ai_analysis')
            ->where('ai_analysis_status', 'completed')
            ->select('ai_analysis')
            ->chunk(500, function ($rows) use (&$aiBuckets) {
                foreach ($rows as $r) {
                    $data  = is_array($r->ai_analysis) ? $r->ai_analysis : json_decode($r->ai_analysis ?? '[]', true);
                    $score = is_array($data) ? (int) ($data['eligibility_score'] ?? $data['score'] ?? 0) : 0;
                    if ($score >= 85)      $aiBuckets['85+']++;
                    elseif ($score >= 70)  $aiBuckets['70-84']++;
                    elseif ($score >= 50)  $aiBuckets['50-69']++;
                    elseif ($score >= 30)  $aiBuckets['30-49']++;
                    else                   $aiBuckets['<30']++;
                }
            });

        // ── TASKS & TEAM LOAD ────────────────────────────────────────
        // Counts per department: total open, overdue, completed in last 7d.
        $departments = ['sales', 'education', 'english', 'immigration', 'accommodation', 'admin'];
        $taskByDept  = collect($departments)->map(function ($d) use ($sevenDays, $now) {
            $base = LeadTask::query()->where('department', $d);
            return [
                'department'  => $d,
                'open'        => (clone $base)->where('completed', false)->count(),
                'overdue'     => (clone $base)->where('completed', false)
                                              ->whereNotNull('due_at')
                                              ->where('due_at', '<', $now)
                                              ->count(),
                'done_7d'     => (clone $base)->where('completed', true)
                                              ->where('completed_at', '>=', $sevenDays)
                                              ->count(),
            ];
        })->values();

        $tasksTotalOpen    = LeadTask::where('completed', false)->count();
        $tasksTotalOverdue = LeadTask::where('completed', false)
                                ->whereNotNull('due_at')
                                ->where('due_at', '<', $now)
                                ->count();
        $tasksTotalDone7d  = LeadTask::where('completed', true)
                                ->where('completed_at', '>=', $sevenDays)
                                ->count();

        // Top 6 staff by open-task load — read-out for staffing decisions.
        $topAssignees = LeadTask::query()
            ->select('assignee_id', DB::raw('COUNT(*) as open_count'))
            ->where('completed', false)
            ->whereNotNull('assignee_id')
            ->groupBy('assignee_id')
            ->orderByDesc('open_count')
            ->limit(6)
            ->get()
            ->map(function ($r) use ($now) {
                $user = User::find($r->assignee_id);
                $overdue = LeadTask::where('assignee_id', $r->assignee_id)
                    ->where('completed', false)
                    ->whereNotNull('due_at')
                    ->where('due_at', '<', $now)
                    ->count();
                return [
                    'id'      => $r->assignee_id,
                    'name'    => $user?->name ?? 'Unknown',
                    'role'    => $user?->role,
                    'open'    => (int) $r->open_count,
                    'overdue' => $overdue,
                ];
            });

        // Recent completions — feeds a "shipped this week" rail.
        $recentDone = LeadTask::with(['assignee:id,name,avatar_path', 'lead:id,first_name,last_name,lead_id'])
            ->where('completed', true)
            ->whereNotNull('completed_at')
            ->orderByDesc('completed_at')
            ->limit(6)
            ->get()
            ->map(fn ($t) => [
                'id'           => $t->id,
                'title'        => $t->title,
                'completed_at' => $t->completed_at,
                'assignee'     => $t->assignee?->name,
                'lead_name'    => $t->lead
                    ? trim("{$t->lead->first_name} {$t->lead->last_name}") ?: $t->lead->lead_id
                    : null,
                'lead_id'      => $t->lead?->id,
            ]);

        // ── BOOKINGS & ASSESSMENTS ───────────────────────────────────
        $bookingsToday    = Booking::whereDate('appointment_date', $today)->count();
        $bookingsThisWeek = Booking::whereBetween('appointment_date', [$weekStart, $weekEnd])->count();
        $bookingsConfirmed = Booking::where('status', 'confirmed')
            ->where('appointment_date', '>=', $today)
            ->count();
        $bookingsPending   = Booking::where('status', 'pending')->count();

        $upcomingBookings = Booking::with('lead:id,first_name,last_name,lead_id')
            ->where('appointment_date', '>=', $today)
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->limit(6)
            ->get()
            ->map(fn ($b) => [
                'id'               => $b->id,
                'name'             => trim("{$b->first_name} {$b->last_name}") ?: 'Unknown',
                'service_type'     => $b->service_type,
                'consultant_name'  => $b->consultant_name,
                'status'           => $b->status,
                'appointment_date' => optional($b->appointment_date)->toDateString(),
                'appointment_time' => $b->appointment_time,
                'lead_id'          => $b->lead_id,
            ]);

        // Recent free-assessment submissions — leads whose source flags them
        // as an assessment + their AI status so the super-admin can see the
        // queue building up.
        $recentAssessments = Lead::where('source', 'like', '%assessment%')
            ->orderByDesc('created_at')
            ->limit(6)
            ->get(['id', 'lead_id', 'first_name', 'last_name', 'created_at', 'ai_analysis_status', 'stage'])
            ->map(fn ($l) => [
                'id'                  => $l->id,
                'lead_id'             => $l->lead_id,
                'name'                => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
                'stage'               => $l->stage,
                'ai_analysis_status'  => $l->ai_analysis_status,
                'created_at'          => $l->created_at,
            ]);

        // ── CROSS-DEPARTMENT ACTIVITY FEED ───────────────────────────
        $activity = ActivityLog::with('user:id,name,role')
            ->orderByDesc('created_at')
            ->limit(40)
            ->get()
            ->map(fn ($a) => [
                'id'          => $a->id,
                'portal'      => $a->portal,
                'action'      => $a->action,
                'description' => $a->description,
                'actor_name'  => $a->actor_name ?? $a->user?->name,
                'actor_role'  => $a->user?->role,
                'created_at'  => $a->created_at,
            ]);

        // ── HEADER KPI ROW ───────────────────────────────────────────
        $kpis = [
            'total_leads'        => $totalLeads,
            'new_leads_7d'       => $newLeads7Days,
            'new_leads_30d'      => $newLeads30Days,
            'converted_total'    => $convertedTotal,
            'open_tasks'         => $tasksTotalOpen,
            'overdue_tasks'      => $tasksTotalOverdue,
            'done_tasks_7d'      => $tasksTotalDone7d,
            'bookings_today'     => $bookingsToday,
            'bookings_this_week' => $bookingsThisWeek,
        ];

        return Inertia::render('admin/SuperDashboard', [
            'ticketSummary'     => \App\Models\SystemTicket::dashboardSummary(),
            'kpis'              => $kpis,
            'pipeline'          => $pipeline,
            'sources'           => $sources,
            'aiBuckets'         => $aiBuckets,
            'taskByDept'        => $taskByDept,
            'topAssignees'      => $topAssignees,
            'recentDone'        => $recentDone,
            'upcomingBookings'  => $upcomingBookings,
            'bookingsConfirmed' => $bookingsConfirmed,
            'bookingsPending'   => $bookingsPending,
            'recentAssessments' => $recentAssessments,
            'activity'          => $activity,
            'generatedAt'       => $now->toIso8601String(),
        ]);
    }
}
