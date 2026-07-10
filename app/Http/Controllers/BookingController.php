<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Services\LeadIntakeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class BookingController extends Controller
{
    public function index()
    {
        $bookings = Booking::with('lead')->latest()->get();

        return Inertia::render('admin/Bookings', [
            'bookings' => $bookings,
        ]);
    }

    public function store(Request $request, LeadIntakeService $intake)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'service_type' => 'required|string',
            'visa_type_id' => 'nullable|integer|exists:visa_types,id',
            'property_id' => 'nullable|integer|exists:accommodation_properties,id',
            'consultant_name' => 'required|string',
            'message' => 'nullable|string',
            'platform' => 'nullable|string',
            'current_country' => 'nullable|string',
            // Slot the visitor selected on the booking page — surfaced on the
            // Sales dashboard's calendar + list immediately on submit.
            'appointment_date' => 'nullable|date',
            'appointment_time' => 'nullable|string|max:50',
            'appointment_at' => 'nullable|date',
            'client_timezone' => 'nullable|string|max:64',
        ]);

        try {
            // Find-or-create the lead through the unified intake. Resubmits
            // by the same email log a `lead.resubmitted` activity entry.
            $lead = $intake->ingest('booking', [
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'country' => $validated['current_country'] ?? null,
                'stage' => 'Booking',
            ], $request);

            $validated['lead_id'] = $lead->id;
            $validated['payment_status'] = Booking::PAYMENT_UNPAID;
            $booking = Booking::create($validated);

            // Property-viewing bookings are free — confirm them by email right
            // away. (Consultation bookings email their invoice after payment,
            // handled in PaymentController.)
            if (! empty($booking->property_id) && ! empty($booking->email)) {
                try {
                    \Illuminate\Support\Facades\Mail::to($booking->email)
                        ->queue(new \App\Mail\ViewingConfirmationMail($booking->fresh('property')));
                } catch (\Throwable $e) {
                    Log::error('Viewing confirmation email failed', ['booking_id' => $booking->id, 'error' => $e->getMessage()]);
                }
            }

            return response()->json([
                'message' => 'Booking created and lead linked successfully',
                'booking_id' => $booking->id,
            ], 201);
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
}
