<?php

namespace App\Notifications;

use App\Models\EoiSubmission;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Sent to the accommodation team when an applicant submits their native
 * Pre-Tenancy form (replacing the Google Form). Tells staff to review it and
 * prepare the tenancy agreement. Database channel only (topbar bell).
 */
class PreTenancyFormSubmitted extends Notification
{
    use Queueable;

    public function __construct(public readonly EoiSubmission $submission) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $name = trim((string) $this->submission->full_legal_name) ?: 'An applicant';

        return [
            'title' => 'Pre-tenancy form submitted',
            'body' => "{$name} submitted their pre-tenancy form — ready to review and prepare the agreement.",
            'submission_id' => $this->submission->id,
            'applicant_name' => $name,
            'link' => "/portal/accommodation/applications/{$this->submission->id}",
        ];
    }
}
