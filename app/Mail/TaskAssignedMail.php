<?php

namespace App\Mail;

use App\Models\LeadTask;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

/**
 * Emails a staff member the moment a task is assigned to them, with the full
 * task detail (description, due date/time, priority, department, related record)
 * and any attached files. Queued so task creation stays snappy. Complements the
 * in-app bell notification (App\Notifications\TaskAssigned).
 */
class TaskAssignedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /** Don't inline files past this combined size — they're listed instead. */
    private const MAX_ATTACH_BYTES = 12 * 1024 * 1024;

    /** Priority pill colours (email-safe hex). */
    private const PRIORITY_STYLES = [
        'urgent' => ['bg' => '#fee2e2', 'fg' => '#b91c1c', 'label' => 'Urgent'],
        'high' => ['bg' => '#ffedd5', 'fg' => '#c2410c', 'label' => 'High'],
        'normal' => ['bg' => '#dbeafe', 'fg' => '#1d4ed8', 'label' => 'Normal'],
        'low' => ['bg' => '#dcfce7', 'fg' => '#15803d', 'label' => 'Low'],
    ];

    /** Files actually inlined on this email: [['path','name','mime'], …]. */
    public array $inline = [];

    /** Filenames inlined vs. skipped (too large) — for an accurate body list. */
    public array $attachedNames = [];

    public array $tooLargeNames = [];

    public function __construct(
        public LeadTask $task,
        public User $recipient,
        public ?string $assignedByName = null,
    ) {
        // Decide inline vs. skip ONCE, now (files exist at dispatch time), so the
        // email body and the real attachments always agree. A file too big to
        // inline is still listed by name; a small file after a big one still
        // gets inlined (we skip the over-cap file, we don't stop).
        $running = 0;
        foreach ($task->attachments as $a) {
            $name = $a->original_filename ?: 'attachment';
            if (! $a->file_path || ! Storage::disk('public')->exists($a->file_path)) {
                continue;
            }
            $size = (int) ($a->size ?: 0);
            if ($running + $size > self::MAX_ATTACH_BYTES) {
                $this->tooLargeNames[] = $name;

                continue;
            }
            $running += $size;
            $this->inline[] = [
                'path' => Storage::disk('public')->path($a->file_path),
                'name' => $name,
                'mime' => $a->mime_type ?: 'application/octet-stream',
            ];
            $this->attachedNames[] = $name;
        }
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🎯 NEW TASK ASSIGNED: '.($this->task->title ?: 'Untitled task'),
        );
    }

    public function content(): Content
    {
        $t = $this->task;
        $lead = $t->lead;

        $due = $t->due_at;
        // Only surface a time when the task actually carries one — a date-only
        // due date sits at midnight and must not read as "at 12:00 AM".
        $hasTime = $due && $due->format('H:i') !== '00:00';
        $dueDisplay = $due
            ? $due->format('l, j M Y').($hasTime ? ' at '.$due->format('g:i A') : '')
            : 'No due date';

        $priorityKey = strtolower($t->priority ?: 'normal');
        $priority = self::PRIORITY_STYLES[$priorityKey] ?? self::PRIORITY_STYLES['normal'];

        return new Content(
            view: 'emails.task-assigned',
            with: [
                'recipientName' => $this->recipient->name ?: 'there',
                'assignedBy' => $this->assignedByName ?: 'A team member',
                'title' => $t->title ?: 'Untitled task',
                'description' => $t->description,
                'dueDisplay' => $dueDisplay,
                'priority' => $priority,
                'department' => $t->department ? ucfirst($t->department) : null,
                'related' => $lead ? (trim("{$lead->first_name} {$lead->last_name}") ?: 'Client') : null,
                'relatedRef' => $lead?->lead_id,
                'attachedNames' => $this->attachedNames,
                'tooLargeNames' => $this->tooLargeNames,
                'url' => $this->tasksUrl(),
            ],
        );
    }

    /**
     * Inline the files chosen at construction, re-checking they still exist.
     */
    public function attachments(): array
    {
        $out = [];
        foreach ($this->inline as $f) {
            if (! is_file($f['path'])) {
                continue;
            }
            $out[] = Attachment::fromPath($f['path'])
                ->as($f['name'])
                ->withMime($f['mime']);
        }

        return $out;
    }

    /**
     * A task board (or dashboard) link the recipient can actually open, based on
     * their role — never a page their role would be 403'd from.
     */
    private function tasksUrl(): string
    {
        $base = rtrim(config('app.url'), '/');
        $role = $this->recipient->role;

        $boards = [
            'sales' => '/portal/sales/tasks',
            'education' => '/portal/education/tasks',
            'immigration' => '/portal/immigration/tasks',
            'immigration_manager' => '/portal/immigration/tasks',
            'immigration_adviser' => '/portal/immigration-adviser/tasks',
            'accommodation' => '/portal/accommodation/tasks',
            'finance' => '/portal/finance/tasks',
        ];

        if (isset($boards[$role])) {
            return $base.$boards[$role];
        }
        if (in_array($role, ['admin', 'super_admin'], true)) {
            return $base.'/admin/tasks';
        }

        // Roles with no task board of their own (english, agent, …) — send them
        // to their own dashboard, which they can always reach.
        return $base.'/portal/'.$role.'/dashboard';
    }
}
