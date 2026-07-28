<?php

namespace App\Mail;

use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sent to a Lead when admin uses "Generate" on Portal Invitations — the
 * account is created with a system-generated password and this email hands
 * the client their login details directly (no setup link). It also tells
 * them to change the password after first login and how to reset it.
 */
class LeadPortalCredentials extends Mailable
{
    use Queueable, SerializesModels;

    public string $firstName;
    public string $loginUrl;
    public string $resetUrl;

    public function __construct(public Lead $lead, public string $plainPassword)
    {
        $this->firstName = $lead->first_name ?: 'there';
        $this->loginUrl = url('/login');
        $this->resetUrl = route('password.request');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your ePathways portal login details',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.lead-portal-credentials',
            with: [
                'firstName' => $this->firstName,
                'email' => $this->lead->email,
                'password' => $this->plainPassword,
                'loginUrl' => $this->loginUrl,
                'resetUrl' => $this->resetUrl,
                'leadId' => $this->lead->lead_id,
            ],
        );
    }
}
