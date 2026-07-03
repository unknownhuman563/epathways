<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

/**
 * Generic mailable for the template system — renders an already-
 * substituted markdown body under the branded ePathways email shell
 * (banner → body → CTA footer + contacts). Queued by default.
 *
 * $bannerImage / $footerImage are optional public-disk relative paths to
 * the branding images; when null the shell falls back to the default
 * ePathways artwork. The blade both embeds them inline (so they render
 * without an external fetch) and exposes a public URL (for background-image
 * overlays that some clients only honour from a real URL).
 *
 * $attachmentFiles is a list of ['path' => <local-disk path>, 'name' =>
 * <original filename>] — stored on the private 'local' disk so the paths
 * survive serialization onto the queue.
 */
class TemplatedMessage extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $subjectLine,
        public string $markdownBody,
        public array $attachmentFiles = [],
        public ?string $bannerImage = null,
        public ?string $footerImage = null,
        public ?int $logId = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->subjectLine);
    }

    /**
     * Carry the MessageLog id as a header so the MessageSent listener can flip
     * that log from 'queued' to 'sent' once delivery to the mail server
     * actually happens (on the queue worker).
     */
    public function headers(): Headers
    {
        return new Headers(
            text: $this->logId ? ['X-Log-Id' => (string) $this->logId] : [],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.branded',
            with: [
                'subjectLine' => $this->subjectLine,
                'bodyHtml'    => $this->bodyHtml(),
                'bannerImage' => $this->bannerImage,
                'footerImage' => $this->footerImage,
            ],
        );
    }

    /**
     * Body content is HTML from the rich-text editor. Legacy templates were
     * authored in Markdown (no HTML tags) — render those through the Markdown
     * parser so old templates keep working.
     */
    private function bodyHtml(): string
    {
        return preg_match('/<[a-z][\s\S]*>/i', $this->markdownBody)
            ? $this->markdownBody
            : Str::markdown($this->markdownBody);
    }

    public function attachments(): array
    {
        return collect($this->attachmentFiles)
            ->map(fn ($a) => Attachment::fromStorageDisk('local', $a['path'])->as($a['name']))
            ->all();
    }
}
