<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Generic mailable for the template system — renders an already-
 * substituted markdown body under the standard ePathways email shell.
 * Queued by default.
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
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->subjectLine);
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.templated',
            with: ['body' => $this->markdownBody],
        );
    }

    public function attachments(): array
    {
        return collect($this->attachmentFiles)
            ->map(fn ($a) => Attachment::fromStorageDisk('local', $a['path'])->as($a['name']))
            ->all();
    }
}
