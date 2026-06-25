<?php

namespace App\Mail;

use App\Models\Lead;
use App\Models\LeadDocument;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Tells a lead that staff reviewed one of their submitted documents
 * (approved or rejected, with an optional reason). Queued.
 */
class DocumentStatusChanged extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $trackUrl;
    public string $firstName;
    public string $documentName;
    public string $status;
    public ?string $reason;

    public function __construct(public Lead $lead, public LeadDocument $document, ?string $reason = null)
    {
        $this->trackUrl     = rtrim(config('app.url'), '/') . '/track/' . $lead->tracking_code;
        $this->firstName    = $lead->first_name ?: 'there';
        $this->documentName = $document->original_name ?: 'your document';
        $this->status       = $document->status;
        $this->reason       = $reason;
    }

    public function envelope(): Envelope
    {
        $word = $this->status === LeadDocument::STATUS_APPROVED ? 'approved' : 'needs attention';

        return new Envelope(
            subject: "Your ePathways document was {$word}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.document-status-changed',
            with: [
                'firstName'    => $this->firstName,
                'trackUrl'     => $this->trackUrl,
                'documentName' => $this->documentName,
                'approved'     => $this->status === LeadDocument::STATUS_APPROVED,
                'reason'       => $this->reason,
            ],
        );
    }
}
