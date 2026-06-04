<?php

namespace App\Http\Controllers;

use App\Models\Assessment;
use App\Models\Booking;
use App\Services\SlotGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

/**
 * Public token-keyed funnel for any visa-type assessment.
 * Pay → Book → Booked. Polymorphic on `intakeable_*` so the same routes
 * serve resident intakes today and other visa-type intakes later.
 */
class AssessmentController extends Controller
{
    /**
     * Resolve an assessment by its public token or 404. Eager-loads visa type.
     */
    private function findOrFail(string $token): Assessment
    {
        return Assessment::with('visaType')
            ->where('token', $token)
            ->firstOrFail();
    }

    /**
     * Pay step (Step 10). Re-locks the price if the previous lock window has
     * expired (>30 days since locked_price_at) — the user gets a banner that
     * tells them the price moved.
     */
    public function showPay(string $token)
    {
        $assessment = $this->findOrFail($token);

        $priceRefreshed = false;
        $previousLocked = $assessment->locked_price_nzd;
        $previousLockedAt = $assessment->locked_price_at;

        // Don't auto-refresh on the form pages — only when they reach Pay.
        if ($assessment->isLockedPriceExpired()) {
            $currentVisaPrice = (float) $assessment->visaType->consultation_price_nzd;
            if ((float) $assessment->locked_price_nzd !== $currentVisaPrice) {
                $assessment->lockCurrentPrice();
                $priceRefreshed = true;
            } else {
                // Same price, just refresh the lock window without surfacing a banner.
                $assessment->lockCurrentPrice();
            }
        }

        return Inertia::render('visa/AssessmentPay', [
            'assessment' => [
                'token'             => $assessment->token,
                'first_name'        => $assessment->applicant_first_name,
                'last_name'         => $assessment->applicant_last_name,
                'email'             => $assessment->applicant_email,
                'payment_status'    => $assessment->payment_status,
                'locked_price_nzd'  => (float) $assessment->locked_price_nzd,
                'locked_price_at'   => $assessment->locked_price_at?->toIso8601String(),
            ],
            'visaType' => [
                'name'                          => $assessment->visaType->name,
                'short_description'             => $assessment->visaType->short_description,
                'consultation_duration_minutes' => $assessment->visaType->consultation_duration_minutes,
            ],
            'priceRefreshed' => $priceRefreshed,
            'previousPrice'  => $priceRefreshed ? (float) $previousLocked : null,
            'previousLockedAt' => $priceRefreshed ? $previousLockedAt?->toIso8601String() : null,
        ]);
    }

    /**
     * Placeholder pay action — stamps paid + forwards to Book. When Stripe
     * is wired up, swap this body for a Stripe Checkout session redirect
     * and have the success callback do the same update.
     */
    public function simulatePay(string $token)
    {
        $assessment = $this->findOrFail($token);

        if (!$assessment->isPaid()) {
            $cents = (int) round(((float) $assessment->locked_price_nzd) * 100);
            $assessment->update([
                'payment_status'       => 'paid',
                'paid_at'              => Carbon::now(),
                'payment_amount_cents' => $cents,
                'payment_currency'     => 'NZD',
                'status'               => 'paid',
            ]);
        }

        return redirect()->route('assessment.book', $assessment->token);
    }

    /**
     * Book step (Step 11) — slot picker.
     */
    public function showBook(string $token, SlotGenerator $slots)
    {
        $assessment = $this->findOrFail($token);

        if (!$assessment->isPaid()) {
            return redirect()->route('assessment.pay', $assessment->token);
        }

        return Inertia::render('visa/AssessmentBook', [
            'assessment' => [
                'token'      => $assessment->token,
                'first_name' => $assessment->applicant_first_name,
                'last_name'  => $assessment->applicant_last_name,
                'email'      => $assessment->applicant_email,
                'booking_id' => $assessment->booking_id,
            ],
            'visaType' => [
                'name'                          => $assessment->visaType->name,
                'consultation_duration_minutes' => $assessment->visaType->consultation_duration_minutes,
            ],
            'slots' => $slots->upcoming(14),
        ]);
    }

    /**
     * Claim a slot. Race-safe — re-checks the (date, time) cell before write.
     */
    public function claimSlot(Request $request, string $token)
    {
        $assessment = $this->findOrFail($token);
        abort_unless($assessment->isPaid(), 403);

        $payload = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'time' => ['required', 'regex:/^\d{2}:\d{2}$/'],
        ]);

        $taken = Booking::query()
            ->whereDate('appointment_date', $payload['date'])
            ->where('appointment_time', $payload['time'])
            ->exists();
        if ($taken) {
            return back()->withErrors(['slot' => 'That slot was just taken — please pick another.']);
        }

        $booking = Booking::create([
            'first_name'         => $assessment->applicant_first_name,
            'last_name'          => $assessment->applicant_last_name,
            'email'              => $assessment->applicant_email,
            'phone'              => $assessment->applicant_phone,
            'service_type'       => $assessment->visaType->name . ' Consultation',
            'consultant_name'    => 'To be assigned',
            'message'            => "Booked from assessment {$assessment->token}.",
            'platform'           => 'Google Calendar',
            'status'             => 'Confirmed',
            'appointment_date'   => $payload['date'],
            'appointment_time'   => $payload['time'],
            'resident_intake_id' => $assessment->intakeable_type === \App\Models\ResidentIntake::class
                ? $assessment->intakeable_id
                : null,
        ]);

        $assessment->update([
            'booking_id' => $booking->id,
            'status'     => 'booked',
        ]);

        return redirect()->route('assessment.booked', $assessment->token);
    }

    /**
     * Confirmation page.
     */
    public function booked(string $token)
    {
        $assessment = $this->findOrFail($token);
        abort_unless($assessment->booking_id, 404);

        $assessment->load('booking');

        return Inertia::render('visa/AssessmentBooked', [
            'assessment' => [
                'token'      => $assessment->token,
                'first_name' => $assessment->applicant_first_name,
                'email'      => $assessment->applicant_email,
            ],
            'visaType' => [
                'name' => $assessment->visaType->name,
            ],
            'booking' => [
                'appointment_date' => $assessment->booking?->appointment_date?->format('Y-m-d'),
                'appointment_time' => $assessment->booking?->appointment_time,
            ],
        ]);
    }
}
