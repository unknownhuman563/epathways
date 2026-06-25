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
}
