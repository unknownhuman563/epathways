<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Lead;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BookingController extends Controller
{
    public function index()
    {
        $bookings = Booking::with('lead')->latest()->get();
        return Inertia::render('Admin/Bookings', [
            'bookings' => $bookings
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'service_type' => 'required|string',
            'consultant_name' => 'required|string',
            'message' => 'nullable|string',
            'platform' => 'nullable|string',
            'current_country' => 'nullable|string',
        ]);

        // Smart Lead Matching & Creation
        $lead = Lead::where('email', $validated['email'])->first();

        if (!$lead) {
            // Create a new lead if they don't exist
            $lead = Lead::create([
                'lead_id' => 'LP-' . rand(10000, 99999),
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'country' => $validated['current_country'] ?? null,
                'status' => 'New',
                'stage' => 'Booking'
            ]);
        }

        $validated['lead_id'] = $lead->id;
        Booking::create($validated);
        return response()->json(['message' => 'Booking created and lead linked successfully'], 201);
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

