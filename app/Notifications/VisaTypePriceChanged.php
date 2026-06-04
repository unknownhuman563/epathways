<?php

namespace App\Notifications;

use App\Models\User;
use App\Models\VisaType;
use App\Models\VisaTypePriceHistory;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to every Immigration + admin user when a visa-type price changes.
 * Database channel powers the in-app inbox; mail channel is only routed for
 * Admin and Immigration-Manager roles (see notification preference in
 * `via()` — recipients without an email-eligible role get the in-app only).
 */
class VisaTypePriceChanged extends Notification
{
    use Queueable;

    public function __construct(
        public readonly VisaType $visaType,
        public readonly VisaTypePriceHistory $entry,
        public readonly string $actorName,
    ) {}

    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if ($notifiable instanceof User
            && $notifiable->hasAnyRole([User::ROLE_SUPER_ADMIN, User::ROLE_ADMIN, User::ROLE_IMMIGRATION_MANAGER])) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $old = $this->entry->old_price_nzd === null
            ? 'not set'
            : '$' . number_format((float) $this->entry->old_price_nzd, 2) . ' NZD';
        $new = '$' . number_format((float) $this->entry->new_price_nzd, 2) . ' NZD';

        return (new MailMessage)
            ->subject("ePathways: {$this->visaType->name} pricing updated")
            ->greeting("Hi {$notifiable->name},")
            ->line("The consultation price for **{$this->visaType->name}** has been updated.")
            ->line("**Previous:** {$old}")
            ->line("**New:** {$new}")
            ->line("**Changed by:** {$this->actorName}")
            ->line("**Reason:** {$this->entry->reason}")
            ->action('Open visa types', url('/portal/immigration/visa-types'))
            ->line('Existing assessments keep their locked-in pricing for 30 days from when they started.');
    }

    public function toArray(object $notifiable): array
    {
        $old = $this->entry->old_price_nzd === null
            ? null
            : '$' . number_format((float) $this->entry->old_price_nzd, 2);
        $new = '$' . number_format((float) $this->entry->new_price_nzd, 2);

        return [
            'title'         => 'Visa pricing updated',
            'body'          => "{$this->visaType->name} consultation price changed from "
                              . ($old ?? 'not set')
                              . " to {$new} by {$this->actorName}.",
            'reason'        => $this->entry->reason,
            'visa_type_id'  => $this->visaType->id,
            'visa_type'     => $this->visaType->name,
            'old_price_nzd' => $this->entry->old_price_nzd,
            'new_price_nzd' => $this->entry->new_price_nzd,
            'link'          => '/portal/immigration/visa-types',
        ];
    }
}
