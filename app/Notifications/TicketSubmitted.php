<?php

namespace App\Notifications;

use App\Models\SystemTicket;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Sent to admins / super-admins when a department raises a system ticket.
 */
class TicketSubmitted extends Notification
{
    use Queueable;

    public function __construct(
        public readonly SystemTicket $ticket,
        public readonly ?string $submitterName,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $who = $this->submitterName ?? 'A staff member';
        $dept = $this->ticket->department ? ucfirst($this->ticket->department) : 'A department';

        return [
            'title'      => 'New system request',
            'body'       => "{$dept} ({$who}) submitted: \"{$this->ticket->title}\".",
            'ticket_id'  => $this->ticket->id,
            'ticket_ref' => $this->ticket->ticket_ref,
            'link'       => '/admin/system-tickets',
        ];
    }
}
