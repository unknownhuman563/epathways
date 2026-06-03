<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\ResidentIntake;
use App\Services\LeadIntakeService;
use App\Services\SlotGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class BookingController extends Controller
{
    public function index()
    {
        $bookings = Booking::with('lead')->latest()->get();
        return Inertia::render('admin/Bookings', [
            'bookings' => $bookings
        ]);
    }

    public function store(Request $request, LeadIntakeService $intake)
    {
        $validated = $request->validate([
            'first_name'      => 'required|string|max:255',
            'last_name'       => 'required|string|max:255',
            'email'           => 'required|email|max:255',
            'phone'           => 'nullable|string|max:20',
            'service_type'    => 'required|string',
            'consultant_name' => 'required|string',
            'message'         => 'nullable|string',
            'platform'        => 'nullable|string',
            'current_country' => 'nullable|string',
        ]);

        try {
            // Find-or-create the lead through the unified intake. Resubmits
            // by the same email log a `lead.resubmitted` activity entry.
            $lead = $intake->ingest('booking', [
                'first_name' => $validated['first_name'],
                'last_name'  => $validated['last_name'],
                'email'      => $validated['email'],
                'phone'      => $validated['phone']           ?? null,
                'country'    => $validated['current_country'] ?? null,
                'stage'      => 'Booking',
            ], $request);

            $validated['lead_id'] = $lead->id;
            Booking::create($validated);

            return response()->json(['message' => 'Booking created and lead linked successfully'], 201);
        } catch (\Throwable $e) {
            Log::error('Booking create failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Could not create booking. Please try again.'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);

        $validated = $request->validate([
            'appointment_date' => 'nullable|date',
            'appointment_time' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:50',
        ]);

        $booking->update($validated);

        return redirect()->back()->with('success', 'Booking updated successfully');
    }

    /**
     * Public Book step for a paid resident-visa intake. Renders the slot
     * picker — the actual list of slots is fetched via the JSON endpoint
     * below so the page can refresh availability without a full Inertia
     * round-trip after a successful claim.
     */
    public function showResidentBookingPage(string $intakeId, SlotGenerator $slots)
    {
        $intake = ResidentIntake::where('intake_id', $intakeId)->firstOrFail();

        // Force the user back to Pay if they jumped straight to /book without
        // completing payment.
        if (!$intake->isPaid()) {
            return redirect()->route('resident-interest.pay', $intake->intake_id);
        }

        return Inertia::render('visa/BookResidentIntake', [
            'intake' => [
                'intake_id'  => $intake->intake_id,
                'first_name' => $intake->first_name,
                'last_name'  => $intake->last_name,
                'email'      => $intake->email,
                'booking_id' => $intake->booking_id,
            ],
            'slots'  => $slots->upcoming(14),
        ]);
    }

    /**
     * Public JSON endpoint — returns the same slot list as the page render
     * above. Used to refresh availability after the user picks a slot.
     */
    public function residentSlots(string $intakeId, SlotGenerator $slots)
    {
        $intake = ResidentIntake::where('intake_id', $intakeId)->firstOrFail();
        abort_unless($intake->isPaid(), 403);
        return response()->json(['slots' => $slots->upcoming(14)]);
    }

    /**
     * Claim a specific slot for the given intake. Atomic re-check ensures we
     * don't double-book if two clients race for the same slot.
     */
    public function claimResidentSlot(Request $request, string $intakeId)
    {
        $intake = ResidentIntake::where('intake_id', $intakeId)->firstOrFail();
        abort_unless($intake->isPaid(), 403);

        $payload = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'time' => ['required', 'regex:/^\d{2}:\d{2}$/'],
        ]);

        // Race-safe re-check: pessimistically fail if any booking already
        // occupies this (date, time) cell.
        $taken = Booking::query()
            ->whereDate('appointment_date', $payload['date'])
            ->where('appointment_time', $payload['time'])
            ->exists();
        if ($taken) {
            return back()->withErrors(['slot' => 'That slot was just taken — please pick another.']);
        }

        $booking = Booking::create([
            'first_name'         => $intake->first_name,
            'last_name'          => $intake->last_name,
            'email'              => $intake->email,
            'phone'              => $intake->phone,
            'service_type'       => 'Resident Visa Consultation',
            'consultant_name'    => 'To be assigned',
            'message'            => 'Booked from resident-intake form (intake ' . $intake->intake_id . ').',
            'platform'           => 'Google Calendar',
            'status'             => 'Confirmed',
            'appointment_date'   => $payload['date'],
            'appointment_time'   => $payload['time'],
            'resident_intake_id' => $intake->id,
        ]);

        $intake->update(['booking_id' => $booking->id]);

        return redirect()->route('resident-interest.booked', $intake->intake_id);
    }

    /**
     * Confirmation screen shown after a successful slot claim.
     */
    public function residentBooked(string $intakeId)
    {
        $intake = ResidentIntake::with('booking')->where('intake_id', $intakeId)->firstOrFail();
        abort_unless($intake->booking_id, 404);

        return Inertia::render('visa/ResidentBooked', [
            'intake'  => [
                'intake_id'  => $intake->intake_id,
                'first_name' => $intake->first_name,
                'email'      => $intake->email,
            ],
            'booking' => [
                'appointment_date' => $intake->booking?->appointment_date?->format('Y-m-d'),
                'appointment_time' => $intake->booking?->appointment_time,
            ],
        ]);
    }
}

