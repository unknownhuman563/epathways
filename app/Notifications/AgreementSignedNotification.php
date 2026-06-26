<?php

namespace App\Notifications;

use App\Models\Agreement;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Build 11.D Phase 3 — Fired when a client signs an agreement via the
 * tracker. Database channel only — surfaces on the topbar bell via
 * NotificationFormatter ('AgreementSigned').
 *
 * Recipient routing is handled at the call site (TrackerAgreementController):
 *   1. If the case has an assignee, notify them.
 *   2. Otherwise, notify all immigration_manager + admin users so the
 *      signed agreement doesn't sit silently with nobody watching.
 */
class AgreementSignedNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly Agreement $agreement)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $a = $this->agreement;
        $a->loadMissing('lead:id,first_name,last_name,lead_id');

        $clientName = trim(($a->lead?->first_name ?? '') . ' ' . ($a->lead?->last_name ?? ''))
            ?: ($a->lead?->lead_id ?? 'Client');

        return [
            'title'        => "Agreement signed by {$clientName}",
            'body'         => $a->title,
            'agreement_id' => $a->id,
            'lead_id'      => $a->lead_id,
            'lead_name'    => $clientName,
            'signed_at'    => $a->signed_at,
            'link'         => "/portal/immigration/cases/{$a->lead_id}/profile?tab=agreement#agreement-{$a->id}",
        ];
    }
}
