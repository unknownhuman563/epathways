<?php

namespace App\Http\Controllers;

use App\Models\DtrEntry;
use App\Models\DtrLeave;
use App\Models\DtrSetting;
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
        // "carry-forward checklist" the user works through the next day.
        $carried = [];
        foreach ($rawEntries->where('work_date', '<', $today)->sortBy('work_date') as $e) {
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

    /** File a leave request — must start at least a week from today. */
    public function fileLeave(Request $request)
    {
        $data = $request->validate([
            'type' => 'required|string|max:40',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string|max:1000',
        ]);

        $setting = DtrSetting::where('user_id', auth()->id())->first();
        $minStart = now($setting?->timezone ?: config('app.timezone', 'UTC'))->addDays(7)->startOfDay();
        if (Carbon::parse($data['start_date'])->startOfDay()->lt($minStart)) {
            return back()->withErrors(['start_date' => 'Leave must be filed at least 1 week (7 days) in advance.']);
        }

        DtrLeave::create(array_merge($data, ['user_id' => auth()->id(), 'status' => 'pending']));

        return back()->with('success', 'Leave request submitted — awaiting approval.');
    }

    /** Admin/super_admin approves or rejects a leave request. */
    public function reviewLeave(Request $request, $id)
    {
        abort_unless(in_array(auth()->user()->role, ['admin', 'super_admin'], true), 403);

        $data = $request->validate(['action' => 'required|in:approve,reject']);
        $leave = DtrLeave::findOrFail($id);
        $leave->update([
            'status' => $data['action'] === 'approve' ? 'approved' : 'rejected',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return back()->with('success', "Leave {$leave->status}.");
    }

    private function leaveRow(DtrLeave $l): array
    {
        return [
            'id' => $l->id,
            'type' => $l->type,
            'start_date' => $l->start_date->toDateString(),
            'end_date' => $l->end_date->toDateString(),
            'reason' => $l->reason,
            'status' => $l->status,
            'user' => $l->relationLoaded('user') && $l->user ? $l->user->name : null,
        ];
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
            $days = 0; $hours = 0; $late = 0; $tasks = 0; $missing = 0; $open = 0;
            foreach ($entries->get($s->user_id, collect()) as $e) {
                $r = $this->computeRow($e, $s);
                if ($r['net_hrs'] !== null) { $days++; $hours += $r['net_hrs']; }
                if ($r['attendance'] === 'Late') { $late++; }
                if ($r['net_hrs'] !== null && $r['tasks_count'] === 0) { $missing++; }
                $tasks += $r['tasks_count'];
                $open += $r['open_count'];
            }

            return [
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
        });

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
            'team' => 'nullable|string|max:120',
            'timezone' => 'required|string|max:64',
            'sched_in' => 'nullable|string|max:8',
            'sched_out' => 'nullable|string|max:8',
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

        DtrSetting::updateOrCreate(['user_id' => $userId], $data);

        return back()->with('success', "DTR set up for {$target->name}.");
    }

    /** Create/update a day's entry (times, tasks, remarks). */
    public function saveEntry(Request $request)
    {
        $data = $request->validate([
            'work_date' => 'required|date',
            'time_in' => 'nullable|string|max:8',
            'time_out' => 'nullable|string|max:8',
            'tasks' => 'nullable|array|max:100',
            'tasks.*.task' => 'nullable|string|max:1000',
            'tasks.*.pending' => 'nullable|string|max:1000',
            'remarks' => 'nullable|string|max:2000',
        ]);

        DtrEntry::updateOrCreate(
            ['user_id' => auth()->id(), 'work_date' => $data['work_date']],
            [
                'time_in' => $data['time_in'] ?? null,
                'time_out' => $data['time_out'] ?? null,
                'tasks' => array_values($data['tasks'] ?? []),
                'remarks' => $data['remarks'] ?? null,
            ],
        );

        return back()->with('success', 'Saved.');
    }

    /** One-tap clock in — stamps the current time (in the user's DTR timezone). */
    public function timeIn()
    {
        $setting = DtrSetting::where('user_id', auth()->id())->first();
        $now = now($setting?->timezone ?: config('app.timezone', 'UTC'));

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
        $setting = DtrSetting::where('user_id', auth()->id())->first();
        $now = now($setting?->timezone ?: config('app.timezone', 'UTC'));

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

        if ($e->time_in && $s && $s->sched_in) {
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
            'tasks_count' => collect($tasks)->filter(fn ($t) => trim((string) ($t['task'] ?? '')) !== '')->count(),
            'open_count' => collect($tasks)->filter(fn ($t) => trim((string) ($t['pending'] ?? '')) !== '')->count(),
        ];
    }

    private function toMinutes(string $hhmm): int
    {
        $parts = explode(':', $hhmm);

        return ((int) ($parts[0] ?? 0)) * 60 + (int) ($parts[1] ?? 0);
    }
}
