<?php

namespace App\Notifications;

use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Sent to a department's staff when a lead is moved into their pipeline
 * (convert-to-student → Education, -case → Immigration, -english, and
 * -accommodation). Database channel only — shows in the bell inbox.
 */
class LeadConvertedToDepartment extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Lead $lead,
        public readonly string $department,   // display label, e.g. 'Education'
        public readonly ?string $convertedByName,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $name = trim("{$this->lead->first_name} {$this->lead->last_name}") ?: 'A lead';
        $actor = $this->convertedByName ?? 'A staff member';

        return [
            'title'      => "New {$this->department} lead",
            'body'       => "{$actor} moved {$name} into {$this->department}.",
            'lead_id'    => $this->lead->id,
            'lead_name'  => $name,
            'department' => $this->department,
            'link'       => "/admin/leads/{$this->lead->id}",
        ];
    }
}
