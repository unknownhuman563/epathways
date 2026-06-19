<?php

namespace App\Notifications;

use App\Models\AiRecordAnalysis;
use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Raised when the AI lead analysis flags a lead as CRITICAL (about to be
 * lost, deadline imminent, etc.). Database channel only — surfaces on the
 * topbar bell via NotificationFormatter ('AiCriticalLeadAlert').
 *
 * The AI never acts on this — it's a heads-up for a human to review.
 */
class AiCriticalLeadAlert extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Lead $lead,
        public readonly AiRecordAnalysis $analysis,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $name = trim(($this->lead->first_name ?? '') . ' ' . ($this->lead->last_name ?? '')) ?: 'Unnamed lead';

        return [
            'title'           => "AI alert: {$name} needs attention",
            'body'            => $this->analysis->summary,
            'lead_id'         => $this->lead->id,
            'lead_name'       => $name,
            'recommendations' => $this->analysis->recommendations ?? [],
            'link'            => "/admin/leads/{$this->lead->id}",
        ];
    }
}
