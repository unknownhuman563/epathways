<?php

namespace App\Notifications;

use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to the new owner when a case is handed off to them (Build 12 phase 2).
 *
 * A silent handoff means the recipient finds out on WhatsApp and the board is
 * just decoration — so this pushes in-app AND email, carries the handoff note,
 * and links straight to the case. This is the detail that decides whether staff
 * trust custody enough to use it.
 */
class CaseHandedOff extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Lead $lead,
        public readonly string $fromName,
        public readonly ?string $note,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    private function caseName(): string
    {
        return trim("{$this->lead->first_name} {$this->lead->last_name}") ?: ($this->lead->lead_id ?: 'a case');
    }

    private function url(): string
    {
        return url("/portal/immigration/cases/{$this->lead->id}/profile");
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('ePathways: '.$this->caseName().' handed to you')
            ->greeting("Hi {$notifiable->name},")
            ->line("{$this->fromName} has handed **{$this->caseName()}** to you — you now own this case.");

        if (filled($this->note)) {
            $mail->line('**Handoff note:**')->line($this->note);
        }

        return $mail
            ->action('Open the case', $this->url())
            ->line('It is now in your queue on the Cases board.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Case handed to you',
            'body' => "{$this->fromName} handed {$this->caseName()} to you."
                .(filled($this->note) ? " Note: {$this->note}" : ''),
            'lead_id' => $this->lead->id,
            'case_name' => $this->caseName(),
            'from_name' => $this->fromName,
            'note' => $this->note,
            'link' => "/portal/immigration/cases/{$this->lead->id}/profile",
        ];
    }
}
