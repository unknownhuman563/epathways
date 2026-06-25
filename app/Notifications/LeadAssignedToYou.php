<?php

namespace App\Notifications;

use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Sent to a staff member when a lead is assigned to them
 * (leads.assigned_to changes). Database channel only in this build.
 */
class LeadAssignedToYou extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Lead $lead,
        public readonly ?int $assignedById,
        public readonly string $assignedByName,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $name = trim("{$this->lead->first_name} {$this->lead->last_name}") ?: 'a lead';

        return [
            'title'            => 'Lead assigned to you',
            'body'             => "{$this->assignedByName} assigned {$name} to you.",
            'lead_id'          => $this->lead->id,
            'lead_name'        => $name,
            'assigned_by_id'   => $this->assignedById,
            'assigned_by_name' => $this->assignedByName,
            'link'             => "/admin/leads/{$this->lead->id}",
        ];
    }
}
