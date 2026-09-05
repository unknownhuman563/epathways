<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Weekly DTR cover email — sent by admin/super_admin from Team Daily Reports.
 * Carries the generated weekly Daily Time Records PDF (every staffer's
 * attendance + hours for the Mon–Sun week) as an attachment, with the standard
 * cover message. Greeting, team label and date range are filled per send.
 *
 * Sent synchronously (not queued) so the sender gets an immediate success/fail
 * flash; the PDF bytes are passed in already rendered.
 */
class DtrWeeklyReport extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $greeting,
        public string $teamLabel,
        public string $rangeLabel,
        public ?string $note,
        public string $pdfBytes,
        public string $pdfName,
    ) {}

    public function envelope(): Envelope
    {
        $replyTo = config('services.contact.reply_to');

        return new Envelope(
            subject: 'Weekly Daily Time Records (DTR) — '.$this->rangeLabel,
            replyTo: $replyTo ? [$replyTo] : [],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.dtr-weekly-report',
            with: [
                'greeting' => $this->greeting,
                'teamLabel' => $this->teamLabel,
                'rangeLabel' => $this->rangeLabel,
                'note' => $this->note,
            ],
        );
    }

    /** @return array<int, Attachment> */
    public function attachments(): array
    {
        return [
            Attachment::fromData(fn () => $this->pdfBytes, $this->pdfName)
                ->withMime('application/pdf'),
        ];
    }
}
