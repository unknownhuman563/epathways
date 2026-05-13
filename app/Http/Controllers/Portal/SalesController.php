<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class SalesController extends Controller
{
    private const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Processing', 'Closed'];

    private const BOOKING_STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

    /** Sales overview: pipeline counts, 6-month trend, recent leads, upcoming consultations. */
    public function dashboard()
    {
        try {
            $now = now();
            $monthStart = $now->copy()->startOfMonth();
            $lastMonthStart = $monthStart->copy()->subMonths(1);

            $leadStats = [
                'total' => Lead::count(),
                'new' => Lead::where('status', 'New')->count(),
                'this_month' => Lead::where('created_at', '>=', $monthStart)->count(),
                'last_month' => Lead::whereBetween('created_at', [$lastMonthStart, $monthStart])->count(),
                'qualified' => Lead::whereIn('status', ['Qualified', 'Processing'])->count(),
                'closed' => Lead::where('status', 'Closed')->count(),
                'ai_done' => Lead::where('ai_analysis_status', 'completed')->count(),
                'ai_pending' => Lead::where('ai_analysis_status', 'processing')->count(),
            ];

            $bookingStats = [
                'total' => Booking::count(),
                'this_month' => Booking::where('created_at', '>=', $monthStart)->count(),
                'upcoming' => Booking::whereDate('appointment_date', '>=', $now->toDateString())->count(),
                'pending' => Booking::where('status', 'Pending')->count(),
            ];

            $leadsByMonth = collect(range(5, 0))->map(function ($i) use ($monthStart) {
                $m = $monthStart->copy()->subMonths($i);

                return [
                    'label' => $m->format('M'),
                    'count' => Lead::whereYear('created_at', $m->year)->whereMonth('created_at', $m->month)->count(),
                ];
            })->all();

            return inertia('portal/sales/Dashboard', [
                'portal' => 'sales',
                'leadStats' => $leadStats,
                'bookingStats' => $bookingStats,
                'leadsByMonth' => $leadsByMonth,
                'recentLeads' => Lead::with(['studyPlans', 'event'])->latest()->limit(8)->get()->map(fn ($l) => $this->leadRow($l)),
                'upcomingBookings' => Booking::with('lead')
                    ->whereDate('appointment_date', '>=', $now->toDateString())
                    ->orderBy('appointment_date')->orderBy('appointment_time')
                    ->limit(8)->get()->map(fn ($b) => $this->bookingRow($b)),
            ]);
        } catch (\Throwable $e) {
            Log::error('Sales dashboard failed', ['error' => $e->getMessage()]);

            return inertia('portal/sales/Dashboard', [
                'portal' => 'sales',
                'leadStats' => array_fill_keys(['total', 'new', 'this_month', 'last_month', 'qualified', 'closed', 'ai_done', 'ai_pending'], 0),
                'bookingStats' => array_fill_keys(['total', 'this_month', 'upcoming', 'pending'], 0),
                'leadsByMonth' => [],
                'recentLeads' => collect(),
                'upcomingBookings' => collect(),
            ]);
        }
    }

    /** Full leads list with inline status updates. */
    public function leads()
    {
        try {
            return inertia('portal/sales/Leads', [
                'portal' => 'sales',
                'statuses' => self::LEAD_STATUSES,
                'leads' => Lead::with(['studyPlans', 'event'])->latest()->get()->map(fn ($l) => $this->leadRow($l)),
            ]);
        } catch (\Throwable $e) {
            Log::error('Sales leads list failed', ['error' => $e->getMessage()]);

            return inertia('portal/sales/Leads', ['portal' => 'sales', 'statuses' => self::LEAD_STATUSES, 'leads' => collect()]);
        }
    }

    public function updateLead(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(self::LEAD_STATUSES)],
            'stage' => 'nullable|string|max:120',
        ]);

        try {
            $lead = Lead::findOrFail($id);
            $from = $lead->status;
            $lead->status = $validated['status'];
            $lead->stage = ! empty($validated['stage']) ? $validated['stage'] : $lead->stage;
            $lead->save();

            ActivityLog::record('lead.updated', [
                'description' => "Lead {$lead->lead_id} ({$lead->first_name} {$lead->last_name}): {$from} → {$lead->status}",
                'properties' => ['lead_id' => $lead->lead_id, 'from' => $from, 'to' => $lead->status, 'stage' => $lead->stage],
            ]);

            return back()->with('success', "Lead {$lead->lead_id} updated.");
        } catch (\Throwable $e) {
            Log::error('Lead update failed', ['id' => $id, 'error' => $e->getMessage()]);

            return back()->with('error', 'Could not update that lead. Please try again.');
        }
    }

    /** Consultation bookings with inline scheduling + status updates. */
    public function bookings()
    {
        try {
            return inertia('portal/sales/Bookings', [
                'portal' => 'sales',
                'statuses' => self::BOOKING_STATUSES,
                'bookings' => Booking::with('lead')->latest()->get()->map(fn ($b) => $this->bookingRow($b)),
            ]);
        } catch (\Throwable $e) {
            Log::error('Sales bookings list failed', ['error' => $e->getMessage()]);

            return inertia('portal/sales/Bookings', ['portal' => 'sales', 'statuses' => self::BOOKING_STATUSES, 'bookings' => collect()]);
        }
    }

    public function updateBooking(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::in(self::BOOKING_STATUSES)],
            'appointment_date' => 'nullable|date',
            'appointment_time' => 'nullable|string|max:50',
            'consultant_name' => 'nullable|string|max:120',
        ]);

        try {
            $booking = Booking::findOrFail($id);
            $booking->update($validated);

            ActivityLog::record('booking.updated', [
                'description' => "Booking #{$booking->id} ({$booking->first_name} {$booking->last_name}) — {$booking->status}",
                'properties' => [
                    'booking_id' => $booking->id,
                    'status' => $booking->status,
                    'appointment_date' => $booking->appointment_date,
                    'appointment_time' => $booking->appointment_time,
                    'consultant_name' => $booking->consultant_name,
                ],
            ]);

            return back()->with('success', "Booking #{$booking->id} updated.");
        } catch (\Throwable $e) {
            Log::error('Booking update failed', ['id' => $id, 'error' => $e->getMessage()]);

            return back()->with('error', 'Could not update that booking. Please try again.');
        }
    }

    private function leadRow(Lead $l): array
    {
        $ai = is_array($l->ai_analysis) ? $l->ai_analysis : [];

        return [
            'id' => $l->id,
            'lead_id' => $l->lead_id,
            'name' => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
            'email' => $l->email,
            'phone' => $l->phone,
            'country' => $l->residence_country ?: $l->country,
            'course' => optional($l->studyPlans->first())->preferred_course,
            'source' => $l->event ? "Event: {$l->event->name}" : ($l->branch ?: 'Online form'),
            'status' => $l->status ?: 'New',
            'stage' => $l->stage,
            'ai_status' => $l->ai_analysis_status,
            'ai_score' => $ai['overall_score'] ?? null,
            'ai_pathway' => $ai['recommended_pathway'] ?? null,
            'created_at' => $l->created_at,
        ];
    }

    private function bookingRow(Booking $b): array
    {
        return [
            'id' => $b->id,
            'name' => trim("{$b->first_name} {$b->last_name}") ?: 'Unknown',
            'email' => $b->email,
            'phone' => $b->phone,
            'service_type' => $b->service_type,
            'consultant_name' => $b->consultant_name,
            'platform' => $b->platform,
            'current_country' => $b->current_country,
            'status' => $b->status ?: 'Pending',
            'appointment_date' => $b->appointment_date ? \Illuminate\Support\Carbon::parse($b->appointment_date)->toDateString() : null,
            'appointment_time' => $b->appointment_time,
            'message' => $b->message,
            'lead_ref' => optional($b->lead)->lead_id,
            'created_at' => $b->created_at,
        ];
    }
}
