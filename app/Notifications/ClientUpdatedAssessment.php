<?php

namespace App\Notifications;

use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Fired when a client edits their visa assessment from the lead portal, which
 * also regenerates their Visa Information Form. Database channel — surfaces on
 * the topbar bell. Recipient routing (all case staff) is at the call site.
 */
class ClientUpdatedAssessment extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Lead $lead,
        public readonly int $pct,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $clientName = trim(($this->lead->first_name ?? '').' '.($this->lead->last_name ?? ''))
            ?: ($this->lead->lead_id ?? 'Client');

        return [
            'title' => "{$clientName} updated their assessment",
            'body' => "Assessment now {$this->pct}% complete — VIF regenerated.",
            'lead_id' => $this->lead->lead_id,
            'lead_name' => $clientName,
            'pct' => $this->pct,
            'link' => "/portal/immigration/cases/{$this->lead->id}/profile?tab=documents",
        ];
    }
}
