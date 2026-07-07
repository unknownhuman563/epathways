<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Checkout\Session as CheckoutSession;
use Stripe\Stripe;
use Stripe\Webhook;

/**
 * Stripe Checkout for consultation bookings. A booking is always saved first
 * (unpaid); this handles the optional payment step: create a hosted Checkout
 * session, then mark the booking paid via the webhook (source of truth) with a
 * success-page fallback so it also works without a configured webhook (dev).
 */
class PaymentController extends Controller
{
    /** Create a Stripe Checkout session for a saved booking and return its URL. */
    public function checkout(Request $request, $bookingId)
    {
        $booking = Booking::findOrFail($bookingId);

        if ($booking->payment_status === Booking::PAYMENT_PAID) {
            return response()->json(['message' => 'This booking is already paid.'], 422);
        }

        $secret = config('services.stripe.secret');
        if (empty($secret)) {
            return response()->json(['message' => 'Payments are not configured yet.'], 503);
        }

        // Fee comes from the chosen visa type when one was selected; otherwise
        // the configurable default consultation fee.
        $visa = $booking->visa_type_id ? \App\Models\VisaType::find($booking->visa_type_id) : null;
        $price = $visa ? (float) $visa->consultation_price_nzd : (float) config('services.booking.immigration_fee', 200);
        $currency = strtolower((string) config('services.booking.currency', 'nzd'));
        $productName = $visa ? ($visa->name.' — Consultation') : ($booking->service_type ?: 'Consultation');

        try {
            Stripe::setApiKey($secret);
            $session = CheckoutSession::create([
                'mode' => 'payment',
                'customer_email' => $booking->email,
                'line_items' => [[
                    'price_data' => [
                        'currency' => $currency,
                        'product_data' => [
                            'name' => $productName,
                            'description' => trim('With '.($booking->consultant_name ?: 'ePathways')),
                        ],
                        'unit_amount' => (int) round($price * 100),
                    ],
                    'quantity' => 1,
                ]],
                'success_url' => route('booking.payment.success').'?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => route('booking.payment.cancel', ['booking' => $booking->id]),
                'metadata' => ['booking_id' => (string) $booking->id],
            ]);

            $booking->update([
                'stripe_session_id' => $session->id,
                'amount' => $price,
                'currency' => $currency,
            ]);

            return response()->json(['url' => $session->url]);
        } catch (\Throwable $e) {
            Log::error('Stripe checkout create failed', ['booking_id' => $booking->id, 'error' => $e->getMessage()]);

            return response()->json(['message' => 'Could not start the payment. Please try again.'], 500);
        }
    }

    /** Stripe → our server: mark the booking paid when Checkout completes. */
    public function webhook(Request $request)
    {
        $secret = config('services.stripe.webhook_secret');
        try {
            $event = Webhook::constructEvent($request->getContent(), $request->header('Stripe-Signature'), $secret);
        } catch (\Throwable $e) {
            Log::warning('Stripe webhook signature verification failed', ['error' => $e->getMessage()]);

            return response('Invalid signature', 400);
        }

        if ($event->type === 'checkout.session.completed') {
            $session = $event->data->object;
            $this->markPaid($session->metadata->booking_id ?? null, $session->id);
        }

        return response('ok', 200);
    }

    /** Success return from Stripe. Verifies the session and marks paid (webhook fallback). */
    public function success(Request $request)
    {
        $sessionId = (string) $request->query('session_id');
        $booking = $sessionId ? Booking::where('stripe_session_id', $sessionId)->first() : null;

        if ($booking && $booking->payment_status !== Booking::PAYMENT_PAID) {
            try {
                Stripe::setApiKey(config('services.stripe.secret'));
                $session = CheckoutSession::retrieve($sessionId);
                if (($session->payment_status ?? null) === 'paid') {
                    $this->markPaid($booking->id, $sessionId);
                    $booking->refresh();
                }
            } catch (\Throwable $e) {
                Log::warning('Stripe success verify failed', ['error' => $e->getMessage()]);
            }
        }

        return inertia('booking/PaymentResult', [
            'status' => $booking?->payment_status === Booking::PAYMENT_PAID ? 'paid' : 'pending',
            'booking' => $this->summary($booking),
        ]);
    }

    /** Cancel/skip return from Stripe — the booking stays saved but unpaid. */
    public function cancel($bookingId)
    {
        $booking = Booking::find($bookingId);

        return inertia('booking/PaymentResult', [
            'status' => 'unpaid',
            'booking' => $this->summary($booking),
            'retryUrl' => $booking ? "/bookings/{$booking->id}/checkout" : null,
        ]);
    }

    private function markPaid(?string $bookingId, ?string $sessionId): void
    {
        $booking = $bookingId ? Booking::find($bookingId) : null;
        if (! $booking && $sessionId) {
            $booking = Booking::where('stripe_session_id', $sessionId)->first();
        }
        if ($booking && $booking->payment_status !== Booking::PAYMENT_PAID) {
            $booking->update([
                'payment_status' => Booking::PAYMENT_PAID,
                'paid_at' => now(),
                'status' => 'Confirmed',
            ]);

            // Email the client their confirmation + invoice (once, on first paid).
            if (! empty($booking->email)) {
                try {
                    \Illuminate\Support\Facades\Mail::to($booking->email)
                        ->queue(new \App\Mail\BookingConfirmationMail($booking->fresh('visaType')));
                } catch (\Throwable $e) {
                    Log::error('Booking confirmation email failed', ['booking_id' => $booking->id, 'error' => $e->getMessage()]);
                }
            }
        }
    }

    private function summary(?Booking $booking): ?array
    {
        if (! $booking) {
            return null;
        }

        return [
            'id' => $booking->id,
            'name' => trim("{$booking->first_name} {$booking->last_name}"),
            'service_type' => $booking->service_type,
            'visa' => $booking->visaType?->name,
            'consultant_name' => $booking->consultant_name,
            'appointment_date' => optional($booking->appointment_date)->toIso8601String(),
            'appointment_time' => $booking->appointment_time,
            'appointment_at' => optional($booking->appointment_at)->toIso8601String(),
            'amount' => $booking->amount,
            'currency' => $booking->currency,
            'payment_status' => $booking->payment_status,
        ];
    }
}
