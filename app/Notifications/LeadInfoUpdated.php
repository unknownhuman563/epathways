<?php

namespace App\Notifications;

use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Sent to a lead's staff when the lead changes a key field (passport
 * number, phone or email) on the public /track/{code} page. Database
 * channel only; the changed values themselves are never included.
 */
class LeadInfoUpdated extends Notification
{
    use Queueable;

    /** @param array<int,string> $fields */
    public function __construct(
        public readonly Lead $lead,
        public readonly array $fields,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $name = trim("{$this->lead->first_name} {$this->lead->last_name}") ?: 'a lead';
        $list = implode(', ', array_map(fn ($f) => str_replace('_', ' ', $f), $this->fields));

        return [
            'title'     => 'Lead updated their details',
            'body'      => "{$name} updated their {$list}.",
            'lead_id'   => $this->lead->id,
            'lead_name' => $name,
            'fields'    => $this->fields,
            'link'      => "/admin/leads/{$this->lead->id}",
        ];
    }
}
