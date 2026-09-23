<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sends a staff-composed onboarding stage email (e.g. the Pre-Tenancy form
 * invite with its native form link) to an applicant. The subject/body come from
 * the StageEmailModal, so they're already personalised; we just wrap the plain
 * text body in a light branded shell and turn any URLs into links. Queued.
 */
class OnboardingStageEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $bodyHtml;

    public function __construct(public string $subjectLine, public string $bodyText)
    {
        // Escape first, then linkify URLs and preserve line breaks — no raw HTML
        // from the (trusted staff) input reaches the template unescaped.
        $escaped = e($bodyText);
        $linked = preg_replace('~(https?://[^\s<]+)~', '<a href="$1" style="color:#1F7A43;font-weight:600;">$1</a>', $escaped);
        $this->bodyHtml = nl2br($linked);
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->subjectLine);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.onboarding-stage',
            with: ['bodyHtml' => $this->bodyHtml],
        );
    }
}
