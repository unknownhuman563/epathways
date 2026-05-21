<?php

namespace App\Mail;

use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sent to a Lead when admin approves the sales agent's portal-access
 * request. Contains a single-use signed setup link valid for 7 days.
 */
class LeadPortalInvitation extends Mailable
{
    use Queueable, SerializesModels;

    public string $setupUrl;
    public string $firstName;

    public function __construct(public Lead $lead, public string $plainToken)
    {
        $this->setupUrl  = route('lead-portal.setup', ['token' => $plainToken]);
        $this->firstName = $lead->first_name ?: 'there';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your ePathways portal access is ready',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.lead-portal-invitation',
            with: [
                'firstName' => $this->firstName,
                'setupUrl'  => $this->setupUrl,
                'leadId'    => $this->lead->lead_id,
            ],
        );
    }
}
