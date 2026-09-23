<?php

namespace App\Notifications;

use App\Models\AccommodationAgreement;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Sent to the accommodation team when a client e-signs their flat/house-sharing
 * agreement. Database channel only (topbar bell).
 */
class AccommodationAgreementSigned extends Notification
{
    use Queueable;

    public function __construct(public readonly AccommodationAgreement $agreement) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $name = trim((string) $this->agreement->client_name) ?: 'A client';

        return [
            'title' => 'Agreement signed',
            'body' => "{$name} signed their {$this->agreement->typeLabel()}.",
            'agreement_id' => $this->agreement->id,
            'link' => $this->agreement->eoi_submission_id
                ? "/portal/accommodation/applications/{$this->agreement->eoi_submission_id}"
                : '/portal/accommodation/forms/agreements',
        ];
    }
}
