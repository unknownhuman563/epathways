<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

/**
 * A ClickUp-style daily digest emailed to a staff member listing every task
 * that is now overdue and assigned to them. Queued. Sent by the scheduled
 * `tasks:overdue-digest` command.
 */
class OverdueTaskDigest extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    private const PRIORITY_STYLES = [
        'urgent' => ['bg' => '#fee2e2', 'fg' => '#b91c1c', 'label' => 'Urgent'],
        'high' => ['bg' => '#ffedd5', 'fg' => '#c2410c', 'label' => 'High'],
        'normal' => ['bg' => '#dbeafe', 'fg' => '#1d4ed8', 'label' => 'Normal'],
        'low' => ['bg' => '#dcfce7', 'fg' => '#15803d', 'label' => 'Low'],
    ];

    /** Pre-shaped task rows — plain data so it survives queue serialisation. */
    public array $rows = [];

    public int $count = 0;

    /**
     * @param  Collection  $tasks  overdue LeadTask models (lead relation loaded)
     */
    public function __construct(public User $recipient, Collection $tasks)
    {
        $now = now();

        $this->rows = $tasks
            ->sortBy(fn ($t) => optional($t->due_at)->timestamp)
            ->map(function ($t) use ($now) {
                $due = $t->due_at;
                $hasTime = $due && $due->format('H:i') !== '00:00';
                $days = $due ? $due->copy()->startOfDay()->diffInDays($now->copy()->startOfDay()) : 0;
                $overdue = $days <= 0 ? 'Due earlier today' : $days.' day'.($days === 1 ? '' : 's').' overdue';

                $priorityKey = strtolower($t->priority ?: 'normal');
                $lead = $t->lead;

                return [
                    'title' => $t->title ?: 'Untitled task',
                    'priority' => self::PRIORITY_STYLES[$priorityKey] ?? self::PRIORITY_STYLES['normal'],
                    'dueDisplay' => $due
                        ? $due->format('j M Y').($hasTime ? ' · '.$due->format('g:i A') : '')
                        : 'No due date',
                    'overdue' => $overdue,
                    'department' => $t->department ? ucfirst($t->department) : null,
                    'related' => $lead ? (trim("{$lead->first_name} {$lead->last_name}") ?: 'Client') : null,
                    'relatedRef' => $lead?->lead_id,
                ];
            })
            ->values()
            ->all();

        $this->count = count($this->rows);
    }

    public function envelope(): Envelope
    {
        $n = $this->count;

        return new Envelope(
            subject: $n === 1 ? 'You have 1 overdue task' : "You have {$n} overdue tasks",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.overdue-task-digest',
            with: [
                'recipientName' => $this->recipient->name ?: 'there',
                'count' => $this->count,
                'rows' => $this->rows,
                'url' => $this->tasksUrl(),
            ],
        );
    }

    /** A task board (or dashboard) link the recipient can actually open. */
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

        return $base.'/portal/'.$role.'/dashboard';
    }
}
