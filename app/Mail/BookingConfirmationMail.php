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
 * Confirmation + invoice for a consultation booking. Queued so it never blocks
 * the payment/booking response. Adapts to paid vs unpaid state.
 */
class BookingConfirmationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Booking $booking) {}

    public function envelope(): Envelope
    {
        $paid = $this->booking->payment_status === Booking::PAYMENT_PAID;
        $title = $this->booking->visaType?->name ?: ($this->booking->service_type ?: 'ePathways Consultation');

        // Send from and reply to the support address (default MAIL_FROM =
        // ePathways Support <support@epathways.co.nz>).
        $support = config('mail.from.address');
        $supportName = config('mail.from.name');

        return new Envelope(
            from: $support ? new Address($support, $supportName ?: null) : null,
            replyTo: $support ? [new Address($support, $supportName ?: null)] : [],
            subject: ($paid ? 'Payment received — ' : 'Booking received — ').$title,
        );
    }

    public function content(): Content
    {
        $b = $this->booking;
        $bizTz = config('services.booking.timezone', 'Pacific/Auckland');

        // Prefer the exact stored moment; render it in NZ (adviser) time and,
        // when we know it, the client's own timezone.
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

        return new Content(
            view: 'emails.booking-confirmation',
            with: [
                'firstName' => $b->first_name ?: 'there',
                'paid' => $b->payment_status === Booking::PAYMENT_PAID,
                'visa' => $b->visaType?->name,
                'service' => $b->service_type,
                'consultant' => $b->consultant_name,
                'dateLine' => $date,
                'timeLine' => $nzTime,
                'clientTime' => $clientTime,
                'clientTz' => $b->client_timezone,
                'amount' => $b->amount ? number_format((float) $b->amount, 2) : null,
                'currency' => strtoupper($b->currency ?: 'NZD'),
                'reference' => 'BK-'.str_pad((string) $b->id, 5, '0', STR_PAD_LEFT),
                'siteUrl' => rtrim((string) config('app.url'), '/'),
                'contactEmail' => config('services.contact.email'),
                'phone' => config('services.contact.phone'),
            ],
        );
    }
}
