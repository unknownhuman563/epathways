<?php

namespace App\Http\Controllers;

use App\Models\ResidentIntake;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class PaymentController extends Controller
{
    /**
     * Public Pay step for a submitted resident-visa intake.
     *
     * Stripe is intentionally NOT wired up yet — the Inertia page renders the
     * fee + a "Continue to payment" button that POSTs `simulate` below.
     * When Stripe Checkout is integrated, swap the button target for the
     * Stripe createCheckoutSession route and let the success callback call
     * `simulate` (or its replacement) server-side.
     */
    public function show(string $intakeId)
    {
        $intake = ResidentIntake::where('intake_id', $intakeId)->firstOrFail();

        $feeCents = (int) Setting::get('resident_intake_fee_cents', 25000);
        $currency = (string) Setting::get('resident_intake_fee_currency', 'NZD');

        return inertia('visa/PayResidentIntake', [
            'intake'   => [
                'intake_id'      => $intake->intake_id,
                'first_name'     => $intake->first_name,
                'last_name'      => $intake->last_name,
                'email'          => $intake->email,
                'payment_status' => $intake->payment_status,
            ],
            'fee'      => [
                'amount_cents' => $feeCents,
                'amount'       => number_format($feeCents / 100, 2),
                'currency'     => $currency,
            ],
        ]);
    }

    /**
     * Placeholder for the real Stripe success callback — marks the intake
     * paid and forwards to the booking step. Replace the body of this method
     * once Stripe is wired up; the route + UI stay the same.
     */
    public function simulate(string $intakeId)
    {
        $intake = ResidentIntake::where('intake_id', $intakeId)->firstOrFail();

        if (!$intake->isPaid()) {
            $intake->update([
                'payment_status'       => 'paid',
                'paid_at'              => Carbon::now(),
                'payment_amount_cents' => (int) Setting::get('resident_intake_fee_cents', 25000),
                'payment_currency'     => (string) Setting::get('resident_intake_fee_currency', 'NZD'),
            ]);
        }

        return redirect()->route('resident-interest.book', $intake->intake_id);
    }
}
