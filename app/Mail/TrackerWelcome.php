<?php

namespace App\Mail;

use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * First-touch email giving a lead their canonical /track/{code} home.
 * Queued so it never blocks lead creation/conversion.
 */
class TrackerWelcome extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $trackUrl;
    public string $firstName;
    public string $context;

    public function __construct(public Lead $lead, string $context = 'application')
    {
        $this->trackUrl  = rtrim(config('app.url'), '/') . '/track/' . $lead->tracking_code;
        $this->firstName = $lead->first_name ?: 'there';
        $this->context   = $context;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Track your ePathways application',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.tracker-welcome',
            with: [
                'firstName' => $this->firstName,
                'trackUrl'  => $this->trackUrl,
                'context'   => $this->context,
            ],
        );
    }
}
