<?php

namespace App\Mail;

use App\Models\Lead;
use App\Services\Immigration\EngagementDocumentGenerator;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Engagement pack notification — sent when immigration staff generate the
 * written agreement + IAA standard documents for a case. Presents the
 * documents as a branded 2×2 icon grid (matching the immigration email
 * design) and points the client at their public /track/{code} page where
 * the PDFs are available. Kind is always 'engagement'.
 *
 * Only the doc types that were actually generated are shown, so a partial
 * selection (e.g. just the Written Agreement) renders just that card.
 */
class EngagementDocumentsReady extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /** Per-document display meta keyed by engagement doc key. */
    private const CARDS = [
        'written_agreement' => [
            'title' => 'Engagement Agreement',
            'blurb' => 'The written agreement outlining our services, responsibilities, fees and terms of engagement.',
            'icon' => 'written-agreement.png',
        ],
        'code_of_conduct' => [
            'title' => 'Licensed Immigration Advisers Code of Conduct 2014',
            'blurb' => 'The professional standards and code of conduct all Licensed Immigration Advisers in New Zealand are required to follow.',
            'icon' => 'code-of-conduct.png',
        ],
        'professional_standards' => [
            'title' => 'Licensed Immigration Advisers Professional Standards',
            'blurb' => 'A summary of the standards that underpin the immigration advice you receive.',
            'icon' => 'professional-standards.png',
        ],
        'complaints_procedure' => [
            'title' => 'Complaints Procedure – D Immigration Consultancy Limited',
            'blurb' => 'This explains our internal complaints process and your options next steps.',
            'icon' => 'complaints-procedure.png',
        ],
    ];

    public string $firstName;

    public string $trackUrl;

    /** @var array<int,array{title:string,blurb:string,icon:string,url:string}> */
    public array $cards;

    /**
     * @param  array<int,string>  $types  Generated engagement doc keys.
     * @param  array<string,int>  $docIds  Map of doc key => generated LeadDocument id,
     *                                     so each card deep-links to its PDF.
     */
    public function __construct(public Lead $lead, array $types = [], array $docIds = [])
    {
        $this->firstName = $lead->first_name ?: 'there';
        $base = rtrim(config('app.url'), '/');
        $this->trackUrl = $base.'/track/'.$lead->tracking_code;

        // Preserve the catalogue order, keep only the generated types, and
        // fall back to the full standard pack when nothing was passed.
        $order = array_keys(EngagementDocumentGenerator::DOCS);
        $selected = array_values(array_intersect($order, $types)) ?: $order;

        $this->cards = array_map(function ($key) use ($docIds, $base, $lead) {
            $card = self::CARDS[$key];
            // Deep-link straight to the generated PDF when we know its id;
            // otherwise fall back to the tracker page.
            $card['url'] = isset($docIds[$key])
                ? $base.'/track/'.$lead->tracking_code.'/documents/'.$docIds[$key].'/download'
                : $this->trackUrl;

            return $card;
        }, array_values(array_filter($selected, fn ($k) => isset(self::CARDS[$k]))));
    }

    public function envelope(): Envelope
    {
        $replyTo = config('services.contact.reply_to');

        return new Envelope(
            subject: 'Your engagement documents are ready — ePathways Migration',
            replyTo: $replyTo ? [$replyTo] : [],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.engagement-documents',
            with: [
                'firstName' => $this->firstName,
                'trackUrl' => $this->trackUrl,
                'cards' => $this->cards,
            ],
        );
    }
}
