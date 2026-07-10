<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

/**
 * Confirmation for a property-viewing booking made on the public /accommodation
 * page. No payment — just the property + date/time details. Queued so it never
 * blocks the booking response.
 */
class ViewingConfirmationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Booking $booking) {}

    public function envelope(): Envelope
    {
        $support = config('mail.from.address');
        $supportName = config('mail.from.name');
        $property = $this->booking->property?->name;

        return new Envelope(
            from: $support ? new Address($support, $supportName ?: null) : null,
            replyTo: $support ? [new Address($support, $supportName ?: null)] : [],
            subject: 'Viewing request received'.($property ? ' — '.$property : ''),
        );
    }

    public function content(): Content
    {
        $b = $this->booking;
        $bizTz = config('services.booking.timezone', 'Pacific/Auckland');

        // Prefer the exact stored moment; render it in NZ time and, when known,
        // the client's own timezone.
        $date = null;
        $nzTime = $b->appointment_time;
        $clientTime = null;
        if ($b->appointment_at) {
            $nz = $b->appointment_at->copy()->setTimezone($bizTz);
            $date = $nz->translatedFormat('l, j F Y');
            $nzTime = $nz->format('g:i A');
            if ($b->client_timezone && $b->client_timezone !== $bizTz) {
                try {
                    $clientTime = $b->appointment_at->copy()->setTimezone($b->client_timezone)->format('g:i A');
                } catch (\Throwable) {
                    $clientTime = null;
                }
            }
        } elseif ($b->appointment_date) {
            try {
                $date = Carbon::parse($b->appointment_date)->translatedFormat('l, j F Y');
            } catch (\Throwable) {
                $date = null;
            }
        }

        $property = $b->property;

        return new Content(
            view: 'emails.viewing-confirmation',
            with: [
                'firstName' => $b->first_name ?: 'there',
                'property' => $property?->name,
                'propertyLocation' => $property?->suburb ?: $property?->location,
                'dateLine' => $date,
                'timeLine' => $nzTime,
                'clientTime' => $clientTime,
                'clientTz' => $b->client_timezone,
                'reference' => 'VW-'.str_pad((string) $b->id, 5, '0', STR_PAD_LEFT),
                'siteUrl' => rtrim((string) config('app.url'), '/'),
                'contactEmail' => config('services.contact.email'),
                'phone' => config('services.contact.phone'),
            ],
        );
    }
}
