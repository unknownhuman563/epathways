<?php

namespace App\Notifications;

use App\Models\SystemTicket;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Sent to the staff member who raised a ticket when an admin updates its
 * status / leaves a response.
 */
class TicketUpdated extends Notification
{
    use Queueable;

    public function __construct(public readonly SystemTicket $ticket) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $status = ucwords(str_replace('_', ' ', $this->ticket->status));
        $body = "Your request \"{$this->ticket->title}\" is now {$status}.";
        if ($this->ticket->admin_response) {
            $body .= ' Response: ' . \Illuminate\Support\Str::limit($this->ticket->admin_response, 120);
        }

        return [
            'title'      => 'Your request was updated',
            'body'       => $body,
            'ticket_id'  => $this->ticket->id,
            'ticket_ref' => $this->ticket->ticket_ref,
            'link'       => null,
        ];
    }
}
