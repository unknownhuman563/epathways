<?php

namespace App\Notifications;

use App\Models\CaseThread;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to the addressee when a thread that requires an answer is put to them
 * (Build 12 phase 6, §7). A question addressed to someone lands in their queue,
 * and — exactly like a handoff (phase 2) — it also pushes in-app + email, so the
 * queue is something people are told about rather than expected to poll.
 */
class CaseThreadAddressed extends Notification
{
    use Queueable;

    public function __construct(
        public readonly CaseThread $thread,
        public readonly string $fromName,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    private function lead(): \App\Models\Lead
    {
        return $this->thread->lead;
    }

    private function caseName(): string
    {
        $lead = $this->lead();

        return trim("{$lead->first_name} {$lead->last_name}") ?: ($lead->lead_id ?: 'a case');
    }

    private function anchorLabel(): string
    {
        return match ($this->thread->anchor_type) {
            CaseThread::ANCHOR_DOCUMENT => 'a document',
            CaseThread::ANCHOR_GATE => 'a gate',
            CaseThread::ANCHOR_STAGE => 'a stage',
            CaseThread::ANCHOR_STEP => 'step '.($this->thread->anchor_key ?? ''),
            default => 'the case',
        };
    }

    private function url(): string
    {
        return url("/portal/immigration/cases/{$this->thread->lead_id}/profile");
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('ePathways: a question for you on '.$this->caseName())
            ->greeting("Hi {$notifiable->name},")
            ->line("{$this->fromName} has a question for you on **{$this->caseName()}** ({$this->anchorLabel()}):")
            ->line('> '.$this->thread->body)
            ->action('Answer on the case', $this->url())
            ->line('It stays in your queue until you mark it answered.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'A question for you',
            'body' => "{$this->fromName} asked on {$this->caseName()} ({$this->anchorLabel()}): {$this->thread->body}",
            'lead_id' => $this->thread->lead_id,
            'thread_id' => $this->thread->id,
            'case_name' => $this->caseName(),
            'from_name' => $this->fromName,
            'link' => "/portal/immigration/cases/{$this->thread->lead_id}/profile",
        ];
    }
}
