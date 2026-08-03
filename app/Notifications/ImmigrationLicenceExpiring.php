<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Active backstop for the Build 12 §2 licence gate. Sent to the licensed
 * adviser and to admins when the adviser's IAA licence hits a warning
 * threshold (see config/immigration.php) or has just expired.
 *
 * The point is to prevent the Monday where the licence lapsed unnoticed and
 * AdviceBearingPolicy silently closed — nobody can record a verdict until it
 * is renewed. The dashboard card is passive (seen only if the adviser opens
 * the portal); this is the push.
 */
class ImmigrationLicenceExpiring extends Notification
{
    use Queueable;

    /**
     * @param  User  $adviser  the licence holder this warning is about
     * @param  int  $daysRemaining  days until expiry — 0 on the day it lapses,
     *                              negative once expired
     */
    public function __construct(
        public readonly User $adviser,
        public readonly int $daysRemaining,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    private function headline(): string
    {
        if ($this->daysRemaining < 0) {
            return "{$this->adviser->name}'s IAA licence has expired";
        }
        if ($this->daysRemaining === 0) {
            return "{$this->adviser->name}'s IAA licence expires today";
        }

        return "{$this->adviser->name}'s IAA licence expires in {$this->daysRemaining} days";
    }

    public function toMail(object $notifiable): MailMessage
    {
        $expiry = optional($this->adviser->iaa_licence_expiry)->toFormattedDateString() ?? 'unknown';
        $forSelf = $notifiable instanceof User && $notifiable->is($this->adviser);

        $mail = (new MailMessage)
            ->subject('ePathways: '.$this->headline())
            ->greeting("Hi {$notifiable->name},")
            ->line($this->headline().'.')
            ->line("**Licence:** {$this->adviser->iaa_licence_number}")
            ->line("**Expiry:** {$expiry}");

        if ($this->daysRemaining < 0) {
            $mail->line('While the licence is lapsed, no verdict, endorsement, RFI response or other advice-bearing action can be recorded — the licence gate is closed until it is renewed.');
        } else {
            $mail->line('Renew before the expiry date so advice-bearing actions are not blocked.');
        }

        return $mail->action(
            'Open the immigration dashboard',
            url('/portal/immigration/dashboard'),
        )->line($forSelf
            ? 'Update your licence details once renewed so the gate reopens.'
            : 'An administrator should confirm the renewal and update the licence record.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'IAA licence expiry',
            'body' => $this->headline().'.',
            'adviser_id' => $this->adviser->id,
            'adviser_name' => $this->adviser->name,
            'days_remaining' => $this->daysRemaining,
            'expiry' => optional($this->adviser->iaa_licence_expiry)->toDateString(),
            'link' => '/portal/immigration/dashboard',
        ];
    }
}
