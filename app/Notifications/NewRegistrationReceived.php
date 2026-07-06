<?php

namespace App\Notifications;

use App\Models\Event;
use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Sent to the sales team (+ admins) when a brand-new lead comes in via the
 * public registration form or an event registration. Database channel only —
 * surfaces in the in-app notification bell and drives the Leads-page tab
 * badges' "new registration" count.
 */
class NewRegistrationReceived extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Lead $lead,
        public readonly string $kind = 'registration', // 'registration' | 'event'
        public readonly ?Event $event = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $name = trim("{$this->lead->first_name} {$this->lead->last_name}") ?: 'A new lead';

        if ($this->kind === 'event') {
            $eventName = $this->event?->name ?: 'an event';

            return [
                'title' => 'New event registration',
                'body'  => "{$name} registered for {$eventName}.",
                'kind'  => 'event',
                'lead_id'   => $this->lead->id,
                'lead_name' => $name,
                'event_id'  => $this->event?->id,
                // Land on the event's registrants list.
                'link' => $this->event
                    ? "/portal/sales/events/{$this->event->id}/registrants"
                    : '/portal/sales/leads?tab=events',
            ];
        }

        return [
            'title' => 'New registration',
            'body'  => "{$name} submitted a registration.",
            'kind'  => 'registration',
            'lead_id'   => $this->lead->id,
            'lead_name' => $name,
            'link' => '/portal/sales/leads?tab=registration',
        ];
    }
}
