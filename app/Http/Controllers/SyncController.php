<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SyncController extends Controller
{
    /**
     * Sync appointment data from Google Apps Script.
     */
    public function syncCalendar(Request $request)
    {
        $token = $request->header('X-Sync-Token');
        if ($token !== env('CALENDAR_SYNC_TOKEN')) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'email' => 'required|email',
            'appointment_date' => 'required|date',
            'appointment_time' => 'required|string',
            'consultant_name' => 'nullable|string',
        ]);

        // Find the latest pending booking for this email
        $booking = Booking::where('email', $validated['email'])
            ->whereIn('status', ['Pending', 'Confirmed']) // Match even if already confirmed to update time
            ->latest()
            ->first();

        if (!$booking) {
            Log::warning("Sync failed: No booking found for email {$validated['email']}");
            return response()->json(['message' => 'Booking not found'], 404);
        }

        $booking->update([
            'appointment_date' => $validated['appointment_date'],
            'appointment_time' => $validated['appointment_time'],
            'status' => 'Confirmed'
        ]);

        return response()->json([
            'message' => 'Calendar synced successfully',
            'booking_id' => $booking->id
        ]);
    }
}

