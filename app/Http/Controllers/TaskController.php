<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\LeadTask;
use App\Models\LeadTaskAttachment;
use App\Models\LeadTaskComment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/**
 * Cross-portal Task API used by the New Task modal (see resources/js/
 * components/task-board/NewTaskModal.jsx).
 *
 * The existing per-lead endpoint POST /admin/leads/{id}/tasks still works
 * and is unchanged — it remains the path used by the lead detail page's
 * "Add Task" panel. This controller adds:
 *
 *   POST /api/tasks                 — create a task (lead-linked OR dept)
 *   GET  /api/tasks/related-records — autocomplete for "Related to" field
 *
 * Both run inside the `web` middleware group so they're session-auth and
 * CSRF-protected the same way every other Inertia POST is.
 */
class TaskController extends Controller
{
    public function store(Request $request)
    {
        $taskType = $request->input('task_type'); // linked | dept
        $user     = $request->user();

        $rules = [
            'task_type'         => 'required|in:linked,dept',
            'title'             => 'required|string|max:200',
            'description'       => 'nullable|string|max:2000',
            'note'              => 'nullable|string|max:500',
            'type'              => ['nullable', Rule::in(LeadTask::TYPES)],
            'priority'          => ['nullable', Rule::in(LeadTask::PRIORITIES)],
            'progress'          => 'nullable|integer|min:0|max:100',
            'due_at'            => 'required|date|after_or_equal:today',
            'assignee_id'       => 'nullable|exists:users,id',
            'department'        => ['nullable', Rule::in(LeadTask::DEPARTMENTS)],
            'tags'              => 'nullable|array',
            'tags.*'            => 'string|max:50',
            'recurrence_config' => 'nullable|array',
            'cross_dept_reason' => 'nullable|string|max:500',
            // Images attached at creation time. Each file ≤ 5 MB; image
            // mimes only — the kanban card renders the first as a
            // thumbnail and the count on the bottom-right paperclip.
            'attachments'   => 'nullable|array|max:8',
            'attachments.*' => 'file|image|max:5120',
        ];

        if ($taskType === 'linked') {
            $rules['lead_id']  = 'required|exists:leads,id';
            $rules['category'] = 'nullable|string|max:100';
        } else {
            $rules['lead_id']  = 'nullable';
            $rules['category'] = 'required|string|max:100';
        }

        $validated = $request->validate($rules);

        // Department — admins/super-admins may explicitly pick one; everyone
        // else is locked to their own role. Stored on the task so the cross-
        // dept badge + filters work even after the assignee changes.
        $department = $validated['department']
            ?? ($user->isAdmin() ? null : $user->role);

        // Cross-department guard — server-side enforcement of the modal's
        // confirmation flow. If the chosen assignee's department differs
        // from the task's department, require an explanatory reason.
        $assignee = isset($validated['assignee_id'])
            ? User::find($validated['assignee_id'])
            : null;
        $isCrossDept = $assignee
            && $department
            && ! $assignee->isAdmin()
            && $assignee->role !== $department;
        if ($isCrossDept && empty($validated['cross_dept_reason'])) {
            return back()->withErrors([
                'cross_dept_reason' => 'A reason is required when assigning to another department.',
            ]);
        }

        try {
            $task = LeadTask::create([
                'lead_id'           => $taskType === 'linked' ? $validated['lead_id'] : null,
                'created_by'        => $user->id,
                'assignee_id'       => $validated['assignee_id'] ?? $user->id,
                'title'             => $validated['title'],
                'description'       => $validated['description'] ?? null,
                'note'              => $validated['note'] ?? null,
                'type'              => $validated['type'] ?? null,
                'category'          => $validated['category'] ?? null,
                'department'        => $department,
                'priority'          => $validated['priority'] ?? 'normal',
                'progress'          => $validated['progress'] ?? 0,
                'due_at'            => $validated['due_at'],
                'tags'              => $validated['tags'] ?? null,
                'recurrence_config' => $validated['recurrence_config'] ?? null,
                'cross_dept_reason' => $isCrossDept ? ($validated['cross_dept_reason'] ?? null) : null,
            ]);

            $this->storeAttachments($request, $task, $user);

            return back()->with('success', "Task “{$task->title}” created.");
        } catch (\Throwable $e) {
            Log::error('Task create failed', ['error' => $e->getMessage(), 'user_id' => $user->id]);

            return back()->withErrors(['error' => 'Could not create task.']);
        }
    }

    /**
     * Patch a single task. Used by the kanban view to flip status as cards
     * are dragged between columns, and to capture optional completion notes
     * when a card is dropped into "Completed".
     *
     * Permission model (mirrored in the kanban UI's lock icon):
     *   - Admins may update any task.
     *   - Other staff may update tasks they own (assignee_id) or that belong
     *     to their department.
     *   - Everything else → 403.
     */
    public function update(Request $request, int $id)
    {
        $user = $request->user();
        $task = LeadTask::findOrFail($id);

        $canEdit = $user->isAdmin()
            || $task->assignee_id === $user->id
            || ($task->department && $task->department === $user->role);

        abort_unless($canEdit, 403, 'You do not have permission to update this task.');

        $validated = $request->validate([
            'status'           => ['sometimes', Rule::in(LeadTask::STATUSES)],
            'completion_notes' => 'sometimes|nullable|string|max:2000',
            'priority'         => ['sometimes', Rule::in(LeadTask::PRIORITIES)],
            'progress'         => 'sometimes|integer|min:0|max:100',
            'title'            => 'sometimes|string|max:200',
            'description'      => 'sometimes|nullable|string|max:2000',
            'note'             => 'sometimes|nullable|string|max:500',
            'due_at'           => 'sometimes|nullable|date',
            'assignee_id'      => 'sometimes|nullable|exists:users,id',
        ]);

        try {
            if (array_key_exists('status', $validated)) {
                $task->status = $validated['status'];
                if ($validated['status'] === 'completed') {
                    $task->completed_by = $user->id;
                    $task->completed_at = $task->completed_at ?? now();
                }
            }

            foreach (['completion_notes', 'priority', 'progress', 'title', 'description', 'note', 'due_at', 'assignee_id'] as $field) {
                if (array_key_exists($field, $validated)) {
                    $task->{$field} = $validated[$field];
                }
            }

            $task->save();

            return back()->with('success', 'Task updated.');
        } catch (\Throwable $e) {
            Log::error('Task update failed', ['task_id' => $id, 'error' => $e->getMessage()]);

            return back()->withErrors(['error' => 'Could not update task.']);
        }
    }

    /**
     * List comments on a task, oldest first. Read access matches the wider
     * staff group (any logged-in portal user can view).
     */
    public function comments(Request $request, int $id)
    {
        try {
            $task = LeadTask::findOrFail($id);

            $rows = $task->comments()
                ->with('author:id,name')
                ->orderBy('created_at')
                ->get()
                ->map(fn ($c) => [
                    'id'         => $c->id,
                    'body'       => $c->body,
                    'created_at' => $c->created_at,
                    'author'     => $c->author ? ['id' => $c->author->id, 'name' => $c->author->name] : null,
                ]);

            return response()->json(['comments' => $rows]);
        } catch (\Throwable $e) {
            Log::error('Task comments list failed', ['task_id' => $id, 'error' => $e->getMessage()]);

            return response()->json(['comments' => []], 500);
        }
    }

    /**
     * Append a comment to a task. Author = current user; body required.
     */
    public function storeComment(Request $request, int $id)
    {
        $task = LeadTask::findOrFail($id);

        $validated = $request->validate([
            'body' => 'required|string|max:5000',
        ]);

        try {
            $comment = LeadTaskComment::create([
                'lead_task_id' => $task->id,
                'user_id'      => $request->user()->id,
                'body'         => $validated['body'],
            ]);
            $comment->load('author:id,name');

            return response()->json([
                'comment' => [
                    'id'         => $comment->id,
                    'body'       => $comment->body,
                    'created_at' => $comment->created_at,
                    'author'     => $comment->author ? ['id' => $comment->author->id, 'name' => $comment->author->name] : null,
                ],
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Task comment create failed', ['task_id' => $id, 'error' => $e->getMessage()]);

            return response()->json(['error' => 'Could not add comment.'], 500);
        }
    }

    /**
     * Attach more images to an existing task. Mirrors the upload validation
     * used at task-create time so the kanban card render stays consistent.
     * The same permission rules as update() apply.
     */
    public function attach(Request $request, int $id)
    {
        $user = $request->user();
        $task = LeadTask::findOrFail($id);

        $canEdit = $user->isAdmin()
            || $task->assignee_id === $user->id
            || $task->created_by  === $user->id
            || ($task->department && $task->department === $user->role);
        abort_unless($canEdit, 403, 'You do not have permission to update this task.');

        $request->validate([
            'attachments'   => 'required|array|max:8',
            'attachments.*' => 'file|image|max:5120',
        ]);

        try {
            $this->storeAttachments($request, $task, $user);

            return back()->with('success', 'Attachment(s) added.');
        } catch (\Throwable $e) {
            Log::error('Task attachment failed', ['task_id' => $id, 'error' => $e->getMessage()]);

            return back()->withErrors(['error' => 'Could not upload attachment.']);
        }
    }

    /**
     * Shared upload routine — used by store() and attach(). Files land in
     * storage/app/public/task-attachments/{taskId}/ so they're served via
     * the storage:link symlink and grouped per-task on disk.
     */
    private function storeAttachments(Request $request, LeadTask $task, User $user): void
    {
        $files = $request->file('attachments') ?? [];
        if (empty($files)) return;

        foreach ($files as $file) {
            if (! $file || ! $file->isValid()) continue;

            $path = $file->store("task-attachments/{$task->id}", 'public');

            LeadTaskAttachment::create([
                'lead_task_id'      => $task->id,
                'file_path'         => $path,
                'original_filename' => $file->getClientOriginalName(),
                'mime_type'         => $file->getMimeType() ?: 'application/octet-stream',
                'size'              => $file->getSize() ?: 0,
                'uploaded_by'       => $user->id,
            ]);
        }
    }

    /**
     * Autocomplete feed for the "Related to" field. Searches Leads filtered
     * by the requested record types — Students / Cases / Accommodation
     * Clients are all `Lead` rows in this codebase, distinguished by the
     * `is_student` / `is_immigration_case` / `is_accommodation_lead` flags.
     */
    public function relatedRecords(Request $request)
    {
        $q     = trim((string) $request->input('q', ''));
        $types = array_filter(explode(',', (string) $request->input('types', 'lead,student,case,client')));

        if (mb_strlen($q) < 2) {
            return response()->json(['records' => []]);
        }

        try {
            $query = Lead::query()->select(
                'id', 'lead_id', 'first_name', 'last_name', 'email',
                'is_student', 'is_immigration_case', 'is_accommodation_lead'
            );

            // Type filter — at least one of the flags must match. "lead"
            // matches the absence of every flag.
            $query->where(function ($q2) use ($types) {
                if (in_array('student', $types, true)) $q2->orWhere('is_student', true);
                if (in_array('case',    $types, true)) $q2->orWhere('is_immigration_case', true);
                if (in_array('client',  $types, true)) $q2->orWhere('is_accommodation_lead', true);
                if (in_array('lead',    $types, true)) {
                    $q2->orWhere(function ($q3) {
                        $q3->where('is_student', false)
                            ->where('is_immigration_case', false)
                            ->where('is_accommodation_lead', false);
                    });
                }
            });

            $query->where(function ($q2) use ($q) {
                $q2->where('first_name', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('lead_id', 'like', "%{$q}%");
            });

            $records = $query->orderBy('first_name')->limit(15)->get()->map(fn ($l) => [
                'id'         => $l->id,
                'lead_id'    => $l->lead_id,
                'name'       => trim("{$l->first_name} {$l->last_name}"),
                'email'      => $l->email,
                'record_type' => $l->is_student ? 'student'
                    : ($l->is_immigration_case ? 'case'
                    : ($l->is_accommodation_lead ? 'client' : 'lead')),
            ]);

            return response()->json(['records' => $records]);
        } catch (\Throwable $e) {
            Log::error('Related records autocomplete failed', ['error' => $e->getMessage()]);

            return response()->json(['records' => []], 500);
        }
    }
}
