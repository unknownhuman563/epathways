<?php

namespace App\Notifications;

use App\Models\AiRecordAnalysis;
use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Raised when the AI case analysis flags an immigration case as CRITICAL
 * (expiring document, missed deadline, INZ response pending, etc.). Database
 * channel only — surfaces on the topbar bell via NotificationFormatter
 * ('AiCriticalCaseAlert').
 *
 * Procedural heads-up for a human consultant — never a visa-outcome claim.
 * The link uses the immigration portal path, which both admins and
 * immigration staff can open.
 */
class AiCriticalCaseAlert extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Lead $case,
        public readonly AiRecordAnalysis $analysis,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $name = trim(($this->case->first_name ?? '') . ' ' . ($this->case->last_name ?? '')) ?: 'Unnamed applicant';

        return [
            'title'           => "AI alert: case {$name} needs attention",
            'body'            => $this->analysis->summary,
            'case_id'         => $this->case->id,
            'case_reference'  => $this->case->inz_reference,
            'applicant_name'  => $name,
            'recommendations' => $this->analysis->recommendations ?? [],
            'link'            => "/portal/immigration/cases/{$this->case->id}/profile",
        ];
    }
}
