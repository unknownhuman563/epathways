<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AccommodationController extends Controller
{
    /**
     * Accommodation overview. No backend models for settlement clients exist
     * yet — this is a scaffold dashboard returning zeros that will be wired up
     * once Accommodation Client / settlement-task tables are introduced.
     */
    public function dashboard()
    {
        try {
            return inertia('portal/accommodation/Dashboard', [
                'clientStats' => [
                    'total' => 0,
                    'pre_arrival' => 0,
                    'recently_arrived' => 0,
                    'settled' => 0,
                ],
                'taskStats' => [
                    'overdue' => 0,
                    'due_this_week' => 0,
                    'completed_this_month' => 0,
                ],
                'recentClients' => collect(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Accommodation dashboard failed', ['error' => $e->getMessage()]);

            return inertia('portal/accommodation/Dashboard', [
                'clientStats' => array_fill_keys(['total', 'pre_arrival', 'recently_arrived', 'settled'], 0),
                'taskStats' => array_fill_keys(['overdue', 'due_this_week', 'completed_this_month'], 0),
                'recentClients' => collect(),
            ]);
        }
    }

    /**
     * Task Board page — mirrors Sales/Education shape. See
     * App\Http\Controllers\Portal\SalesController::tasks() for the
     * canonical implementation.
     */
    public function tasks(Request $request)
    {
        try {
            $userId   = $request->user()->id;
            $scope    = $request->input('scope', 'mine');
            $now      = now();
            $todayEnd = $now->copy()->endOfDay();
            $weekEnd  = $now->copy()->endOfWeek();

            $base = \App\Models\LeadTask::with(['lead:id,lead_id,first_name,last_name,email,status', 'assignee:id,name', 'creator:id,name', 'attachments'])
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
                'creator'      => $t->creator  ? ['id' => $t->creator->id,  'name' => $t->creator->name]  : null,
                'lead'         => $t->lead ? [
                    'id'      => $t->lead->id,
                    'lead_id' => $t->lead->lead_id,
                    'name'    => trim("{$t->lead->first_name} {$t->lead->last_name}"),
                    'status'  => $t->lead->status,
                ] : null,
            ];

            // Full task set for the kanban (all dates, all statuses).
            $allTasks     = (clone $base)->orderByDesc('created_at')->limit(1000)->get()->map($serialize);
            $today        = (clone $base)->where('completed', false)->whereBetween('due_at', [$now, $todayEnd])->orderBy('due_at')->get()->map($serialize);
            $overdue      = (clone $base)->where('completed', false)->whereNotNull('due_at')->where('due_at', '<', $now)->orderBy('due_at')->get()->map($serialize);
            $thisWeek     = (clone $base)->where('completed', false)->whereBetween('due_at', [$todayEnd, $weekEnd])->orderBy('due_at')->get()->map($serialize);
            $undated      = (clone $base)->where('completed', false)->whereNull('due_at')->orderByDesc('created_at')->limit(50)->get()->map($serialize);
            $recentlyDone = (clone $base)->where('completed', true)->where('completed_at', '>=', $now->copy()->subDays(7))->orderByDesc('completed_at')->limit(50)->get()->map($serialize);

            return inertia('portal/accommodation/Tasks', [
                'portal'        => 'accommodation',
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
            Log::error('Accommodation tasks page failed', ['error' => $e->getMessage()]);
            return inertia('portal/accommodation/Tasks', ['portal' => 'accommodation', 'scope' => 'mine', 'today' => [], 'overdue' => [], 'this_week' => [], 'undated' => [], 'recently_done' => [], 'staffOptions' => []]);
        }
    }
}
