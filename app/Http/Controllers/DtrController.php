<?php

namespace App\Http\Controllers;

use App\Models\DtrEntry;
use App\Models\DtrLeave;
use App\Models\DtrSetting;
use App\Models\DtrSettingHistory;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Daily Time & Task Record (DTR) — each user's own time in/out + task log.
 * One settings row per user (the "yellow cells": schedule, std hours, grace,
 * break rule) and one entry per working day. Net Hrs / Variance / Attendance
 * are computed here from the settings, mirroring the spreadsheet.
 */
class DtrController extends Controller
{
    public function show()
    {
        $user = auth()->user();
        $setting = DtrSetting::where('user_id', $user->id)->first();
        $today = now($setting?->timezone ?: config('app.timezone', 'UTC'))->toDateString();

        $rawEntries = DtrEntry::where('user_id', $user->id)
            ->orderByDesc('work_date')
            ->limit(60)
            ->get();

        $entries = $rawEntries->map(fn (DtrEntry $e) => $this->computeRow($e, $setting))->values();

        // Pending items from earlier days that aren't ticked done yet — the
        // "carry-forward checklist". A pending item written on any past day
        // keeps showing here every day until it's marked done, so nothing gets
        // lost. Queried straight from the DB (reliable date compare, not capped
        // by the 60-row recent-entries window above).
        $carried = [];
        $pastPending = DtrEntry::where('user_id', $user->id)
            ->whereDate('work_date', '<', $today)
            ->orderBy('work_date')
            ->get(['id', 'work_date', 'tasks']);
        foreach ($pastPending as $e) {
            foreach ((array) $e->tasks as $idx => $t) {
                $pending = trim((string) ($t['pending'] ?? ''));
                if ($pending !== '' && empty($t['pending_done'])) {
                    $carried[] = [
                        'entry_id' => $e->id,
                        'index' => $idx,
                        'text' => $pending,
                        'date' => $e->work_date->toDateString(),
                    ];
                }
            }
        }

        // Render under the portal chrome the request came through (mirrors the
        // Leads pattern — each portal has a thin re-export of dtr/DtrPage).
        $path = request()->path();
        $page = 'admin/Dtr';
        foreach (['sales', 'education', 'english', 'immigration', 'accommodation', 'agent', 'finance'] as $role) {
            if (str_starts_with($path, "portal/{$role}/")) {
                $page = "portal/{$role}/Dtr";
            }
        }

        $leaves = DtrLeave::where('user_id', $user->id)
            ->orderByDesc('start_date')->limit(50)->get()
            ->map(fn (DtrLeave $l) => $this->leaveRow($l))->values();

        // Admin/super_admin also see everyone's leaves + the pending queue in
        // the Leave tab's overview dashboard.
        $isAdmin = in_array($user->role, ['admin', 'super_admin'], true);
        $adminLeaves = collect();
        $pendingLeaves = collect();
        if ($isAdmin) {
            $all = DtrLeave::with('user:id,name')->orderByDesc('start_date')->limit(300)->get();
            $adminLeaves = $all->map(fn (DtrLeave $l) => $this->leaveRow($l))->values();
            $pendingLeaves = $all->where('status', 'pending')
                ->map(fn (DtrLeave $l) => $this->leaveRow($l))->values();
        }

        // Holidays for the calendar — country inferred from team / timezone.
        $tz = $setting?->timezone ?? '';
        $team = strtolower((string) ($setting?->team ?? ''));
        $country = (str_contains($team, 'philippin') || $tz === 'Asia/Manila') ? 'PH'
            : ((str_contains($team, 'zealand') || $tz === 'Pacific/Auckland') ? 'NZ' : 'PH');
        $holidays = config("dtr_holidays.{$country}", []);

        return inertia($page, [
            'setting' => $setting,
            'entries' => $entries,
            'carried' => $carried,
            'leaves' => $leaves,
            'adminLeaves' => $adminLeaves,
            'adminPendingLeaves' => $pendingLeaves,
            'holidays' => $holidays,
            'leaveTypes' => DtrLeave::TYPES,
            // Earliest date a leave can start — enforces the 1-week advance rule.
            'minLeaveDate' => now($setting?->timezone ?: config('app.timezone', 'UTC'))->addDays(7)->toDateString(),
            'account' => ['name' => $user->name, 'email' => $user->email],
            'today' => $today,
            // HR/admin get a link to the team-wide summary + setup manager.
            'canSummary' => in_array($user->role, ['admin', 'super_admin'], true),
            'canManage' => in_array($user->role, ['admin', 'super_admin'], true),
        ]);
    }

    /**
     * Admin/super_admin only — the DTR setup manager. Lists every staff member
     * with their setup status so admin can create or edit each person's yellow
     * cells (schedule, timezone, std hours, etc.). Staff never self-setup: they
     * only clock in/out and log tasks against the config admin gives them.
     */
    public function manage()
    {
        abort_unless(in_array(auth()->user()->role, ['admin', 'super_admin'], true), 403);

        $settings = DtrSetting::get()->keyBy('user_id');

        $staff = User::where('role', '!=', User::ROLE_LEAD)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role'])
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
                'setting' => $settings->get($u->id),
            ])->values();

        return inertia('admin/DtrManage', [
            'staff' => $staff,
        ]);
    }

    /**
     * File a leave application (the full "Application for Leave" form,
     * Sections 1–4). Must start at least a week from today, be declared, and
     * carry the employee's drawn signature.
     */
    public function fileLeave(Request $request)
    {
        $setting = $this->requireSetting();

        $data = $request->validate([
            'full_name' => 'nullable|string|max:160',
            'position' => 'nullable|string|max:160',
            'type' => 'required|string|max:60',
            'other_specify' => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'return_date' => 'nullable|date',
            'total_days' => 'nullable|numeric|min:0|max:366',
            'half_day' => 'nullable|in:AM,PM,N/A',
            'reason' => 'nullable|string|max:2000',
            'declaration' => 'required|accepted',
            'employee_signature' => 'required|string|max:2000000', // PNG data URI
        ]);

        $minStart = now($setting->timezone ?: config('app.timezone', 'UTC'))->addDays(7)->startOfDay();
        if (Carbon::parse($data['start_date'])->startOfDay()->lt($minStart)) {
            return back()->withErrors(['start_date' => 'Leave must be filed at least 1 week (7 days) in advance.']);
        }

        DtrLeave::create(array_merge($data, [
            'user_id' => auth()->id(),
            'status' => 'pending',
            'declaration' => true,
            'employee_signed_at' => now(),
        ]));

        return back()->with('success', 'Leave application submitted — awaiting manager approval.');
    }

    /**
     * Manager assessment & approval (Section 5). Admin/super_admin records the
     * decision, working days, operational impact, comments and their drawn
     * signature. Also accepts the legacy {action:approve|reject} shorthand.
     */
    public function reviewLeave(Request $request, $id)
    {
        abort_unless(in_array(auth()->user()->role, ['admin', 'super_admin'], true), 403);

        // Legacy shorthand from older quick-approve buttons.
        if ($request->filled('action') && ! $request->filled('decision')) {
            $request->merge(['decision' => $request->input('action') === 'reject' ? 'Declined' : 'Approved']);
        }

        $data = $request->validate([
            'decision' => 'required|in:Approved,Approved in part,Declined,Deferred',
            'working_days_approved' => 'nullable|string|max:60',
            'operational_impact' => 'nullable|in:Low,Medium,High',
            'manager_comments' => 'nullable|string|max:2000',
            'manager_signature' => 'nullable|string|max:2000000',
        ]);

        $statusMap = [
            'Approved' => 'approved',
            'Approved in part' => 'approved',
            'Declined' => 'rejected',
            'Deferred' => 'deferred',
        ];

        $leave = DtrLeave::findOrFail($id);
        $leave->update([
            'decision' => $data['decision'],
            'working_days_approved' => $data['working_days_approved'] ?? null,
            'operational_impact' => $data['operational_impact'] ?? null,
            'manager_comments' => $data['manager_comments'] ?? null,
            'manager_signature' => $data['manager_signature'] ?: $leave->manager_signature,
            'manager_signed_at' => ! empty($data['manager_signature']) ? now() : $leave->manager_signed_at,
            'status' => $statusMap[$data['decision']],
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return back()->with('success', "Leave {$data['decision']}.");
    }

    /**
     * Full leave record incl. signatures — fetched on demand for the detail
     * view so the (large) signature data URIs stay out of list payloads.
     * Own leave, or any leave for admin/super_admin.
     */
    public function showLeave($id)
    {
        $leave = DtrLeave::with('user:id,name')->findOrFail($id);
        $isAdmin = in_array(auth()->user()->role, ['admin', 'super_admin'], true);
        abort_unless($isAdmin || $leave->user_id === auth()->id(), 403);

        return response()->json($this->leaveRow($leave, true));
    }

    /**
     * Team Daily Reports — admin/super_admin. For the picked date: every
     * staffer's submission status + their report (times, tasks, remarks). Plus
     * per-day submission counts across the month for the calendar indicator.
     */
    public function reports(Request $request)
    {
        abort_unless(in_array(auth()->user()->role, ['admin', 'super_admin'], true), 403);

        $tz = config('app.timezone', 'UTC');
        $date = Carbon::parse($request->query('date') ?: now($tz))->toDateString();
        $month = Carbon::parse($date)->startOfMonth();
        $monthStart = $month->toDateString();
        $monthEnd = $month->copy()->endOfMonth()->toDateString();

        $settings = DtrSetting::with('user:id,name')->get();
        $userIds = $settings->pluck('user_id');
        $staffCount = $settings->count();

        // Per-day submission counts for the month (calendar indicator).
        $monthEntries = DtrEntry::whereIn('user_id', $userIds)
            ->whereBetween('work_date', [$monthStart, $monthEnd])->get();
        $dayCounts = [];
        foreach ($monthEntries->groupBy(fn (DtrEntry $e) => $e->work_date->toDateString()) as $d => $rows) {
            $dayCounts[$d] = $rows->filter(fn (DtrEntry $e) => $this->isSubmitted($e))->count();
        }

        // Roster for the selected date.
        $dayEntries = DtrEntry::whereIn('user_id', $userIds)->where('work_date', $date)->get()->keyBy('user_id');
        $leaves = DtrLeave::where('status', 'approved')
            ->whereDate('start_date', '<=', $date)->whereDate('end_date', '>=', $date)
            ->get()->keyBy('user_id');

        $roster = $settings->map(function (DtrSetting $s) use ($dayEntries, $leaves) {
            $e = $dayEntries->get($s->user_id);
            $row = $e ? $this->computeRow($e, $s) : [];
            $leave = $leaves->get($s->user_id);

            return [
                'user_id' => $s->user_id,
                'name' => $s->user?->name ?: ($s->label ?: 'Unknown'),
                'team' => $s->team ?: 'Unassigned',
                'position' => $s->position,
                'on_leave' => $leave?->type,
                'submitted' => $e ? $this->isSubmitted($e) : false,
                'time_in' => $row['time_in'] ?? null,
                'time_out' => $row['time_out'] ?? null,
                'net_hrs' => $row['net_hrs'] ?? null,
                'variance' => $row['variance'] ?? null,
                'attendance' => $row['attendance'] ?? null,
                'tasks' => $row['tasks'] ?? [],
                'remarks' => $row['remarks'] ?? null,
                'tasks_count' => $row['tasks_count'] ?? 0,
                'open_count' => $row['open_count'] ?? 0,
            ];
        })->sortBy('name')->values();

        return inertia('admin/DtrReports', [
            'date' => $date,
            'today' => now($tz)->toDateString(),
            'staffCount' => $staffCount,
            'dayCounts' => $dayCounts,
            'roster' => $roster,
        ]);
    }

    /**
     * Admin edit of any staffer's day entry (Team Daily Reports). Unlike the
     * self-service saveEntry — which locks past days for everyone — an admin may
     * amend a closed record here. Preserves the carried-pending "done" ticks by
     * merging on the payload's own pending_done flags.
     */
    public function adminUpdateEntry(Request $request)
    {
        abort_unless(in_array(auth()->user()->role, ['admin', 'super_admin'], true), 403);

        $data = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'work_date' => 'required|date',
            'time_in' => 'nullable|string|max:8',
            'time_out' => 'nullable|string|max:8',
            'tasks' => 'nullable|array|max:100',
            'tasks.*.task' => 'nullable|string|max:1000',
            'tasks.*.pending' => 'nullable|string|max:1000',
            'tasks.*.pending_done' => 'nullable|boolean',
            'remarks' => 'nullable|string|max:2000',
        ]);

        // The target must have a DTR set up (an admin can't invent a record for
        // a user who was never onboarded).
        abort_unless(DtrSetting::where('user_id', $data['user_id'])->exists(), 422, 'This user has no DTR set up.');

        $date = Carbon::parse($data['work_date'])->toDateString();

        $tasks = array_values(array_map(fn ($t) => [
            'task' => (string) ($t['task'] ?? ''),
            'pending' => (string) ($t['pending'] ?? ''),
            'pending_done' => (bool) ($t['pending_done'] ?? false),
        ], $data['tasks'] ?? []));

        DtrEntry::updateOrCreate(
            ['user_id' => $data['user_id'], 'work_date' => $date],
            [
                'time_in' => $data['time_in'] ?: null,
                'time_out' => $data['time_out'] ?: null,
                'tasks' => $tasks,
                'remarks' => $data['remarks'] ?: null,
            ],
        );

        return back()->with('success', 'DTR record updated.');
    }

    /**
     * Admin delete of a staffer's day entry (Team Daily Reports). Removes the
     * whole record for that user + day.
     */
    public function adminDeleteEntry(Request $request)
    {
        abort_unless(in_array(auth()->user()->role, ['admin', 'super_admin'], true), 403);

        $data = $request->validate([
            'user_id' => 'required|integer',
            'work_date' => 'required|date',
        ]);

        DtrEntry::where('user_id', $data['user_id'])
            ->where('work_date', Carbon::parse($data['work_date'])->toDateString())
            ->delete();

        return back()->with('success', 'DTR record deleted.');
    }

    /**
     * Generate a single day's report as a downloadable PDF — proof of the work
     * done that day (times, net/variance/attendance, tasks, remarks). A user
     * can generate their own; admin/super_admin can generate any staffer's.
     */
    public function dailyReport(Request $request)
    {
        $data = $request->validate([
            'date' => 'required|date',
            'user' => 'nullable|integer',
        ]);
        $date = Carbon::parse($data['date'])->toDateString();

        $isAdmin = in_array(auth()->user()->role, ['admin', 'super_admin'], true);
        $targetId = ($isAdmin && ! empty($data['user'])) ? (int) $data['user'] : auth()->id();
        abort_if(! $isAdmin && ! empty($data['user']) && (int) $data['user'] !== auth()->id(), 403);

        $setting = DtrSetting::with('user:id,name,email')->where('user_id', $targetId)->first();
        abort_if(! $setting, 404, 'No DTR set up for this user.');

        $entry = DtrEntry::where('user_id', $targetId)->where('work_date', $date)->first();
        $row = $entry ? $this->computeRow($entry, $setting) : null;

        $fmt = fn ($hhmm) => $hhmm ? Carbon::createFromFormat('H:i', $hhmm)->format('g:i A') : '—';

        // The record keeps completed work in `task` and for-tomorrow items in
        // `pending` — surface them as two clean lists in the report.
        $allTasks = collect($row['tasks'] ?? []);
        $completed = $allTasks->filter(fn ($t) => ($t['status'] ?? '') !== 'todo')
            ->map(fn ($t) => trim((string) ($t['task'] ?? '')))->filter()->values()->all();
        $pending = $allTasks->map(fn ($t) => trim((string) ($t['pending'] ?? '')))->filter()->values()->all();

        $isFlexi = $setting->schedule_type === 'flexi';

        $payload = [
            'logo_data' => $this->brandLogoData(),
            'name' => $setting->user?->name ?: ($setting->label ?: 'Staff'),
            'position' => $setting->position,
            'employment' => $setting->employment_type === 'part_time' ? 'Part-time' : 'Full-time',
            'team' => $setting->team,
            'timezone' => $setting->timezone,
            'scheduleLabel' => $isFlexi ? 'Flexi — no fixed hours' : ($fmt($setting->sched_in).' – '.$fmt($setting->sched_out)),
            'flexi' => $isFlexi,
            'date' => $date,
            'prettyDate' => Carbon::parse($date)->format('l, F j, Y'),
            'timeIn' => $fmt($row['time_in'] ?? null),
            'timeOut' => $fmt($row['time_out'] ?? null),
            'netHrs' => isset($row['net_hrs']) && $row['net_hrs'] !== null ? number_format($row['net_hrs'], 2) : '—',
            'variance' => isset($row['variance']) && $row['variance'] !== null ? ($row['variance'] >= 0 ? '+' : '').number_format($row['variance'], 2) : '—',
            'attendance' => $row['attendance'] ?? '—',
            'remarks' => $row['remarks'] ?? null,
            'completed' => $completed,
            'pending' => $pending,
            'generatedAt' => now($setting->timezone ?: config('app.timezone', 'UTC'))->format('M j, Y g:i A'),
        ];

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('dtr.daily-report', $payload)->setPaper('a4');
        $slug = \Illuminate\Support\Str::slug($payload['name']);

        return $pdf->download("DTR_{$slug}_{$date}.pdf");
    }

    /**
     * Base64 data URI of the ePathways brand logo for the PDF header. The file
     * lives at resources/assets/ep_only.* (present on the server, not committed
     * locally). Returns '' if absent, so the header falls back to the wordmark.
     */
    private function brandLogoData(): string
    {
        $map = ['png' => 'png', 'jpg' => 'jpeg', 'jpeg' => 'jpeg', 'webp' => 'webp', 'gif' => 'gif', 'svg' => 'svg+xml'];
        foreach ($map as $ext => $mime) {
            $path = base_path("resources/assets/ep_only.{$ext}");
            if (is_file($path)) {
                return "data:image/{$mime};base64,".base64_encode(file_get_contents($path));
            }
        }

        return '';
    }

    /** A day's report counts as "submitted" once clocked out or tasks logged. */
    private function isSubmitted(DtrEntry $e): bool
    {
        if ($e->time_out) {
            return true;
        }

        return collect((array) $e->tasks)->contains(fn ($t) => trim((string) ($t['task'] ?? '')) !== '');
    }

    private function leaveRow(DtrLeave $l, bool $withSignatures = false): array
    {
        $row = [
            'id' => $l->id,
            'user' => $l->relationLoaded('user') && $l->user ? $l->user->name : null,
            'full_name' => $l->full_name,
            'position' => $l->position,
            'type' => $l->type,
            'other_specify' => $l->other_specify,
            'start_date' => optional($l->start_date)->toDateString(),
            'end_date' => optional($l->end_date)->toDateString(),
            'return_date' => optional($l->return_date)->toDateString(),
            'total_days' => $l->total_days,
            'half_day' => $l->half_day,
            'reason' => $l->reason,
            'declaration' => (bool) $l->declaration,
            'employee_signed_at' => optional($l->employee_signed_at)->toDateString(),
            'has_employee_signature' => ! empty($l->employee_signature),
            'status' => $l->status,
            'decision' => $l->decision,
            'working_days_approved' => $l->working_days_approved,
            'operational_impact' => $l->operational_impact,
            'manager_comments' => $l->manager_comments,
            'manager_signed_at' => optional($l->manager_signed_at)->toDateString(),
            'has_manager_signature' => ! empty($l->manager_signature),
        ];

        if ($withSignatures) {
            $row['employee_signature'] = $l->employee_signature;
            $row['manager_signature'] = $l->manager_signature;
        }

        return $row;
    }

    /** Tick / untick a carried-forward pending item as done. */
    public function togglePending(Request $request)
    {
        $data = $request->validate([
            'entry_id' => 'required|integer',
            'index' => 'required|integer|min:0',
            'done' => 'required|boolean',
        ]);

        $entry = DtrEntry::where('user_id', auth()->id())->findOrFail($data['entry_id']);
        $tasks = is_array($entry->tasks) ? $entry->tasks : [];
        if (isset($tasks[$data['index']])) {
            $tasks[$data['index']]['pending_done'] = $data['done'];
            $entry->tasks = array_values($tasks);
            $entry->save();
        }

        return back();
    }

    /** Team Summary dashboard — every staffer's DTR figures over a period. */
    public function summary(Request $request)
    {
        abort_unless(in_array(auth()->user()->role, ['admin', 'super_admin'], true), 403);

        $tz = config('app.timezone', 'UTC');
        $start = \Illuminate\Support\Carbon::parse($request->query('start') ?: now($tz)->startOfMonth())->startOfDay();
        $end = \Illuminate\Support\Carbon::parse($request->query('end') ?: now($tz)->endOfMonth())->endOfDay();

        $settings = DtrSetting::with('user:id,name')->get();
        $entries = DtrEntry::whereIn('user_id', $settings->pluck('user_id'))
            ->whereBetween('work_date', [$start->toDateString(), $end->toDateString()])
            ->get()
            ->groupBy('user_id');

        $rows = $settings->map(function (DtrSetting $s) use ($entries) {
            $days = 0;
            $hours = 0;
            $late = 0;
            $tasks = 0;
            $missing = 0;
            $open = 0;
            $userEntries = $entries->get($s->user_id, collect());
            foreach ($userEntries as $e) {
                $r = $this->computeRow($e, $s);
                if ($r['net_hrs'] !== null) {
                    $days++;
                    $hours += $r['net_hrs'];
                }
                if ($r['attendance'] === 'Late') {
                    $late++;
                }
                if ($r['net_hrs'] !== null && $r['tasks_count'] === 0) {
                    $missing++;
                }
                $tasks += $r['tasks_count'];
                $open += $r['open_count'];
            }

            return [
                'has_activity' => $userEntries->isNotEmpty(),
                'name' => $s->user?->name ?: ($s->label ?: 'Unknown'),
                'team' => $s->team ?: 'Unassigned',
                'days_logged' => $days,
                'total_hours' => round($hours, 2),
                'avg_hrs' => $days ? round($hours / $days, 2) : 0,
                'late_days' => $late,
                'tasks_recorded' => $tasks,
                'days_missing_tasks' => $missing,
                'open_items' => $open,
            ];
        })
        // Only show staff who actually have a DTR record in this period — a
        // staffer with nothing logged (or whose record was deleted) drops off
        // the summary entirely instead of showing an all-zero row.
            ->filter(fn ($r) => $r['has_activity'])
            ->values();

        $teams = $rows->groupBy('team')
            ->map(fn ($teamRows, $team) => [
                'team' => $team,
                'staff' => $teamRows->sortBy('name')->values(),
                'subtotal' => $this->sumCols($teamRows),
            ])
            ->sortBy('team')->values();

        $pendingLeaves = DtrLeave::with('user:id,name')
            ->where('status', 'pending')->orderBy('start_date')->get()
            ->map(fn (DtrLeave $l) => $this->leaveRow($l))->values();

        return inertia('admin/DtrSummary', [
            'teams' => $teams,
            'total' => $this->sumCols($rows),
            'start' => $start->toDateString(),
            'end' => $end->toDateString(),
            'pendingLeaves' => $pendingLeaves,
        ]);
    }

    /** Sum the numeric columns for a set of staff rows (team subtotal / grand total). */
    private function sumCols($rows): array
    {
        $days = $rows->sum('days_logged');
        $hours = round($rows->sum('total_hours'), 2);

        return [
            'days_logged' => $days,
            'total_hours' => $hours,
            'avg_hrs' => $days ? round($hours / $days, 2) : 0,
            'late_days' => $rows->sum('late_days'),
            'tasks_recorded' => $rows->sum('tasks_recorded'),
            'days_missing_tasks' => $rows->sum('days_missing_tasks'),
            'open_items' => $rows->sum('open_items'),
        ];
    }

    /**
     * Save a staff member's setup (the yellow cells). Admin/super_admin only —
     * staff no longer configure their own DTR; the admin sets each person's
     * schedule/timezone/hours and the user just clocks in/out against it.
     */
    public function saveSetup(Request $request)
    {
        abort_unless(in_array(auth()->user()->role, ['admin', 'super_admin'], true), 403);

        $data = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'label' => 'nullable|string|max:120',
            'position' => 'nullable|string|max:120',
            'employment_type' => 'nullable|in:full_time,part_time',
            'team' => 'nullable|string|max:120',
            'timezone' => 'required|string|max:64',
            'sched_in' => 'nullable|string|max:8',
            'sched_out' => 'nullable|string|max:8',
            'schedule_type' => 'nullable|in:fixed,flexi',
            'break_hours' => 'nullable|numeric|min:0|max:24',
            'reports_to' => 'nullable|string|max:120',
            'std_hours' => 'nullable|numeric|min:0|max:24',
            'grace_mins' => 'nullable|integer|min:0|max:240',
            'break_after' => 'nullable|numeric|min:0|max:24',
        ]);

        // A DTR belongs to a staff account, never an external lead.
        $target = User::findOrFail($data['user_id']);
        abort_if($target->role === User::ROLE_LEAD, 422, 'Leads do not have a DTR.');

        $userId = $data['user_id'];
        unset($data['user_id']);
        $data['is_complete'] = true;
        $data['employment_type'] = $data['employment_type'] ?? 'full_time';
        $data['schedule_type'] = $data['schedule_type'] ?? 'fixed';

        // Flexi has no fixed schedule — clear the clock-in/grace fields so a
        // stale time never gets used to flag lateness that doesn't apply.
        if ($data['schedule_type'] === 'flexi') {
            $data['sched_in'] = null;
            $data['sched_out'] = null;
        }

        // Snapshot the before-state so we can audit exactly what changed.
        $existing = DtrSetting::where('user_id', $userId)->first();

        $setting = DtrSetting::updateOrCreate(['user_id' => $userId], $data);

        $this->recordSettingHistory($userId, $existing, $setting);

        return back()->with('success', "DTR set up for {$target->name}.");
    }

    /** Human labels for the audited setup fields, in display order. */
    private const SETTING_FIELDS = [
        'label' => 'DTR name',
        'position' => 'Position',
        'employment_type' => 'Employment',
        'team' => 'Team',
        'timezone' => 'Time zone',
        'schedule_type' => 'Schedule type',
        'sched_in' => 'Sched. in',
        'sched_out' => 'Sched. out',
        'break_hours' => 'Break (hrs)',
        'break_after' => 'Break after (hrs)',
        'std_hours' => 'Std hrs / day',
        'grace_mins' => 'Grace (mins)',
        'reports_to' => 'Reports to',
    ];

    /** Pretty labels for coded setup values, shown in the change history. */
    private const SETTING_VALUE_LABELS = [
        'full_time' => 'Full-time',
        'part_time' => 'Part-time',
        'fixed' => 'Fixed schedule',
        'flexi' => 'Flexi time',
    ];

    /**
     * Write an audit row when a staffer's DTR setup is created or changed.
     * `$before` is null on first setup (logged as a "created" entry listing the
     * initial values); otherwise only fields that actually moved are recorded.
     */
    private function recordSettingHistory(int $userId, ?DtrSetting $before, DtrSetting $after): void
    {
        $norm = fn ($v) => $v === null || $v === '' ? null : (is_numeric($v) ? (string) (0 + $v) : (string) $v);

        $changes = [];
        foreach (array_keys(self::SETTING_FIELDS) as $field) {
            $old = $before ? $norm($before->getAttribute($field)) : null;
            $new = $norm($after->getAttribute($field));

            if ($before === null) {
                if ($new !== null) {
                    $changes[$field] = ['from' => null, 'to' => $new];
                }
            } elseif ($old !== $new) {
                $changes[$field] = ['from' => $old, 'to' => $new];
            }
        }

        if (empty($changes)) {
            return; // nothing actually changed — don't log a no-op save
        }

        DtrSettingHistory::create([
            'user_id' => $userId,
            'changed_by' => auth()->id(),
            'changed_by_name' => auth()->user()->name,
            'action' => $before ? 'updated' : 'created',
            'changes' => $changes,
        ]);
    }

    /**
     * Audit trail for one staffer's DTR setup — the change log shown in the
     * Setup Manager. Admin/super_admin only.
     */
    public function settingHistory($userId)
    {
        abort_unless(in_array(auth()->user()->role, ['admin', 'super_admin'], true), 403);

        $tz = config('app.timezone', 'UTC');

        $rows = DtrSettingHistory::where('user_id', $userId)
            ->orderByDesc('created_at')->orderByDesc('id')
            ->limit(200)->get()
            ->map(fn (DtrSettingHistory $h) => [
                'id' => $h->id,
                'action' => $h->action,
                'by' => $h->changed_by_name ?: 'System',
                'at' => optional($h->created_at)->timezone($tz)->format('M j, Y g:i A'),
                'changes' => collect($h->changes ?? [])->map(fn ($c, $field) => [
                    'field' => self::SETTING_FIELDS[$field] ?? $field,
                    'from' => self::SETTING_VALUE_LABELS[$c['from'] ?? ''] ?? ($c['from'] ?? null),
                    'to' => self::SETTING_VALUE_LABELS[$c['to'] ?? ''] ?? ($c['to'] ?? null),
                ])->values()->all(),
            ])->values();

        return response()->json(['history' => $rows]);
    }

    /**
     * Guard: staff can only log against a DTR their admin has set up. Returns
     * the completed setting or aborts — used by every self-service write.
     */
    private function requireSetting(): DtrSetting
    {
        $setting = DtrSetting::where('user_id', auth()->id())->where('is_complete', true)->first();
        abort_if(! $setting, 403, 'Your DTR has not been set up by an admin yet.');

        return $setting;
    }

    /** Create/update a day's entry (times, tasks, remarks). */
    public function saveEntry(Request $request)
    {
        $setting = $this->requireSetting();

        $data = $request->validate([
            'work_date' => 'required|date',
            'time_in' => 'nullable|string|max:8',
            'time_out' => 'nullable|string|max:8',
            'tasks' => 'nullable|array|max:100',
            'tasks.*.task' => 'nullable|string|max:1000',
            'tasks.*.pending' => 'nullable|string|max:1000',
            'tasks.*.status' => 'nullable|in:todo,done,carry',
            'tasks.*.pending_done' => 'nullable|boolean',
            'close_carried' => 'nullable|array|max:200',
            'close_carried.*.entry_id' => 'required|integer',
            'close_carried.*.index' => 'required|integer|min:0',
            'remarks' => 'nullable|string|max:2000',
        ]);

        // Past days are locked — only the current day (in the user's DTR
        // timezone) may be written. No one, admin or otherwise, edits a
        // closed record through this endpoint.
        $today = now($setting->timezone ?: config('app.timezone', 'UTC'))->toDateString();
        abort_if($data['work_date'] !== $today, 403, 'Past days are locked and cannot be edited.');

        // Completed (task) and for-tomorrow (pending) items are the record; to-do
        // rows are stored too (status=todo) so the plan survives a refresh, but
        // they're kept out of every count/report/carry-over below.
        $tasks = array_values(array_map(fn ($t) => [
            'task' => (string) ($t['task'] ?? ''),
            'pending' => (string) ($t['pending'] ?? ''),
            'status' => in_array($t['status'] ?? '', ['todo', 'done', 'carry'], true)
                ? $t['status']
                : (trim((string) ($t['pending'] ?? '')) !== '' ? 'carry' : 'done'),
            'pending_done' => (bool) ($t['pending_done'] ?? false),
        ], $data['tasks'] ?? []));

        DtrEntry::updateOrCreate(
            ['user_id' => auth()->id(), 'work_date' => $data['work_date']],
            [
                'time_in' => $data['time_in'] ?? null,
                'time_out' => $data['time_out'] ?? null,
                'tasks' => $tasks,
                'remarks' => $data['remarks'] ?? null,
            ],
        );

        // Carried-over items resolved today (completed or re-carried) get closed
        // on their source entry so they stop rolling forward. Scoped to the
        // signed-in user's own entries.
        foreach ($data['close_carried'] ?? [] as $c) {
            $src = DtrEntry::where('user_id', auth()->id())->find($c['entry_id']);
            if (! $src) {
                continue;
            }
            $t = is_array($src->tasks) ? $src->tasks : [];
            if (isset($t[$c['index']])) {
                $t[$c['index']]['pending_done'] = true;
                $src->tasks = array_values($t);
                $src->save();
            }
        }

        // No flash — the DTR page shows an inline "Saved" badge itself; a global
        // toast on every autosave would be noise.
        return back();
    }

    /** One-tap clock in — stamps the current time (in the user's DTR timezone). */
    public function timeIn()
    {
        $setting = $this->requireSetting();
        $now = now($setting->timezone ?: config('app.timezone', 'UTC'));

        $entry = DtrEntry::firstOrNew(['user_id' => auth()->id(), 'work_date' => $now->toDateString()]);
        if (! $entry->time_in) {
            $entry->time_in = $now->format('H:i');
            $entry->save();
        }

        return back()->with('success', 'Timed in at '.$now->format('g:i A'));
    }

    /** One-tap clock out — closes the latest open shift (handles cross-midnight). */
    public function timeOut()
    {
        $setting = $this->requireSetting();
        $now = now($setting->timezone ?: config('app.timezone', 'UTC'));

        $entry = DtrEntry::where('user_id', auth()->id())
            ->whereNotNull('time_in')->whereNull('time_out')
            ->where('work_date', '>=', $now->copy()->subDay()->toDateString())
            ->orderByDesc('work_date')
            ->first()
            ?? DtrEntry::firstOrNew(['user_id' => auth()->id(), 'work_date' => $now->toDateString()]);

        $entry->time_out = $now->format('H:i');
        $entry->save();

        return back()->with('success', 'Timed out at '.$now->format('g:i A'));
    }

    /** Derive Net Hrs / Variance / Attendance + task counts for one entry. */
    private function computeRow(DtrEntry $e, ?DtrSetting $s): array
    {
        $stdHours = $s ? (float) $s->std_hours : 8.0;
        $breakHours = $s ? (float) $s->break_hours : 1.0;
        $breakAfter = $s ? (float) $s->break_after : 6.0;
        $graceMins = $s ? (int) $s->grace_mins : 10;

        $net = null;
        $variance = null;
        $attendance = null;

        if ($e->time_in && $e->time_out) {
            $inMin = $this->toMinutes($e->time_in);
            $outMin = $this->toMinutes($e->time_out);
            if ($outMin <= $inMin) {
                $outMin += 24 * 60; // shift crosses midnight
            }
            $worked = ($outMin - $inMin) / 60.0;
            $net = round($worked >= $breakAfter ? $worked - $breakHours : $worked, 2);
            $variance = round($net - $stdHours, 2);
        }

        if ($s && $s->schedule_type === 'flexi') {
            // Flexi has no fixed clock-in — never Late. Any clock-in is fine.
            $attendance = $e->time_in ? 'Flexi' : null;
        } elseif ($e->time_in && $s && $s->sched_in) {
            $attendance = $this->toMinutes($e->time_in) <= ($this->toMinutes($s->sched_in) + $graceMins)
                ? 'On Time' : 'Late';
        }

        $tasks = is_array($e->tasks) ? $e->tasks : [];

        return [
            'id' => $e->id,
            'work_date' => optional($e->work_date)->toDateString(),
            'day' => optional($e->work_date)->format('D'),
            'time_in' => $e->time_in,
            'time_out' => $e->time_out,
            'net_hrs' => $net,
            'variance' => $variance,
            'attendance' => $attendance,
            'tasks' => $tasks,
            'remarks' => $e->remarks,
            'tasks_count' => collect($tasks)->filter(fn ($t) => trim((string) ($t['task'] ?? '')) !== '' && ($t['status'] ?? '') !== 'todo')->count(),
            'open_count' => collect($tasks)->filter(fn ($t) => trim((string) ($t['pending'] ?? '')) !== '')->count(),
        ];
    }

    private function toMinutes(string $hhmm): int
    {
        $parts = explode(':', $hhmm);

        return ((int) ($parts[0] ?? 0)) * 60 + (int) ($parts[1] ?? 0);
    }
}
