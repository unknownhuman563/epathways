<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\EoiSubmission;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AccommodationController extends Controller
{
    /**
     * Accommodation overview — property listings + Expression of Interest stats.
     */
    public function dashboard()
    {
        try {
            return inertia('portal/accommodation/Dashboard', [
                'propertyStats' => [
                    'total' => Property::count(),
                    'available' => Property::where('status', 'available')->count(),
                    'unavailable' => Property::where('status', 'unavailable')->count(),
                ],
                'applicationStats' => [
                    'total' => EoiSubmission::count(),
                    'new' => EoiSubmission::where('status', 'new')->count(),
                    'hot' => EoiSubmission::where('form_type', 'hot')->count(),
                    'cold' => EoiSubmission::where('form_type', 'cold')->count(),
                ],
                'recentProperties' => Property::with('images')->latest()->take(5)->get(),
                'recentApplications' => EoiSubmission::latest()->take(5)->get(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Accommodation dashboard failed', ['error' => $e->getMessage()]);

            return inertia('portal/accommodation/Dashboard', [
                'propertyStats' => array_fill_keys(['total', 'available', 'unavailable'], 0),
                'applicationStats' => array_fill_keys(['total', 'new', 'hot', 'cold'], 0),
                'recentProperties' => collect(),
                'recentApplications' => collect(),
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

            $base = \App\Models\LeadTask::with(['lead:id,lead_id,first_name,last_name,email,status', 'assignee:id,name,avatar_path', 'creator:id,name,avatar_path', 'attachments'])
                ->withCount('comments')
                ->when($scope === 'mine', fn ($q) => $q->where('assignee_id', $userId))
                ->when($scope === 'department', fn ($q) => $q->where('department', 'accommodation'));

            $serialize = fn ($t) => [
                'id'           => $t->id,
                'title'        => $t->title,
                'description'  => $t->description,
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
                    'mime_type'         => $a->mime_type,
                    'size'              => $a->size,
                ])->values(),
                'assignee'     => $t->assignee ? ['id' => $t->assignee->id, 'name' => $t->assignee->name, 'avatar_url' => $t->assignee->avatar_url] : null,
                'additional_assignee_ids' => $t->additional_assignee_ids ?? [],
                'additional_lead_ids'     => $t->additional_lead_ids ?? [],
                'creator'      => $t->creator  ? ['id' => $t->creator->id,  'name' => $t->creator->name, 'avatar_url' => $t->creator->avatar_url]  : null,
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
                'staffOptions'  => \App\Models\User::whereNotIn('role', ['lead', 'revoked_lead'])->orderBy('name')->get(['id', 'name', 'role', 'avatar_path']),
                'recent_activity' => \App\Models\ActivityLog::where('action', 'like', 'lead_task.%')
                    ->latest()->limit(30)
                    ->get(['id', 'action', 'description', 'actor_name', 'actor_role', 'properties', 'created_at']),
            ]);
        } catch (\Throwable $e) {
            Log::error('Accommodation tasks page failed', ['error' => $e->getMessage()]);
            return inertia('portal/accommodation/Tasks', ['portal' => 'accommodation', 'scope' => 'mine', 'today' => [], 'overdue' => [], 'this_week' => [], 'undated' => [], 'recently_done' => [], 'staffOptions' => []]);
        }
    }
}
