<?php

namespace App\Mail;

use App\Models\Lead;
use App\Models\LeadDocumentRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Tells a lead that staff need a specific document, linking to their
 * tracker page where they can upload it. Queued.
 */
class DocumentRequestedFromLead extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $trackUrl;
    public string $firstName;
    public string $documentLabel;

    public function __construct(public Lead $lead, public LeadDocumentRequest $request)
    {
        $this->trackUrl      = rtrim(config('app.url'), '/') . '/track/' . $lead->tracking_code;
        $this->firstName     = $lead->first_name ?: 'there';
        $this->documentLabel = $request->label ?: 'a document';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'ePathways needs your ' . $this->documentLabel,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.document-requested',
            with: [
                'firstName'     => $this->firstName,
                'trackUrl'      => $this->trackUrl,
                'documentLabel' => $this->documentLabel,
                'description'   => $this->request->description,
            ],
        );
    }
}
