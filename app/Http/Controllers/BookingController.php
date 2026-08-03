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

    /**
     * Send the booking_confirmation_1 template with the appointment details.
     * Resolves the template by key across any department, and maps the booking
     * into the LazyMagnet-style dotted variables the template expects. The Meet
     * link becomes the meeting location once the calendar event is created.
     */
    private function sendBookingConfirmation(Booking $booking, \App\Models\Lead $lead): void
    {
        try {
            $template = \App\Models\MessageTemplate::active()
                ->where('key', 'booking_confirmation_1')
                ->get()
                ->sortBy(fn ($t) => $t->department === '' ? 0 : 1)
                ->first();
            if (! $template) {
                return;
            }

            $tz = $booking->client_timezone ?: config('app.timezone', 'UTC');
            $when = $booking->appointment_at
                ? \Illuminate\Support\Carbon::parse($booking->appointment_at)->setTimezone($tz)
                : null;
            $trackerUrl = rtrim((string) config('app.url'), '/').'/track/'.$lead->tracking_code;

            $extra = [
                'contact.email' => $booking->email,
                'appointment.only_start_date' => $when?->format('j M Y') ?? '',
                'appointment.start_time' => $when?->format('g:i A') ?? ($booking->appointment_time ?? ''),
                'appointment.timezone' => $tz,
                'appointment.meeting_location' => $booking->meet_link ?: 'Google Meet — link in your calendar invite',
                'tracker_url' => $trackerUrl,
                'reschedule_url' => $trackerUrl, // TODO: dedicated reschedule flow
                'cancel_url' => $trackerUrl,     // TODO: dedicated cancel flow
            ];

            app(\App\Services\CommunicationService::class)->sendTemplate($template, $lead, $extra);
        } catch (\Throwable $e) {
            Log::error('Booking confirmation email failed', ['booking_id' => $booking->id, 'error' => $e->getMessage()]);
        }
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
            // Full intake blob (JSON string) + document uploads from the custom
            // consultation form.
            'intake' => 'nullable|string',
            'documents' => 'nullable|array',
            'documents.*' => 'nullable|array',
            'documents.*.*' => 'file|mimes:pdf,doc,docx,xls,csv,jpg,jpeg,png,gif|max:10240',
        ]);

        // Decode the intake blob; store it verbatim on the booking.
        $intakeData = $request->filled('intake') ? json_decode($request->input('intake'), true) : null;
        if (! is_array($intakeData)) {
            $intakeData = null;
        }
        $validated['intake'] = $intakeData;
        unset($validated['documents']); // handled separately, not a booking column

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

            // Map the key intake scalars onto the lead for pipeline use.
            if ($intakeData) {
                foreach ([
                    'age' => 'age', 'gender' => 'gender', 'civil_status' => 'marital_status',
                    'city' => 'residence_city', 'current_location' => 'residence_country',
                    'country_of_origin' => 'country_of_birth',
                ] as $src => $col) {
                    if (! empty($intakeData[$src])) {
                        $lead->{$col} = $intakeData[$src];
                    }
                }
                if (isset($intakeData['number_of_children']) && $intakeData['number_of_children'] !== '') {
                    $lead->number_of_children = (int) $intakeData['number_of_children'];
                    $lead->has_children = (int) $intakeData['number_of_children'] > 0;
                }
                if (! empty($intakeData['partner_name'])) {
                    $lead->has_dependent_partner = true;
                }
                $lead->save();
            }

            // Store uploaded documents on the PRIVATE disk and record them as
            // LeadDocuments (never the world-readable public disk).
            foreach ($request->file('documents', []) as $bucket => $files) {
                foreach ((array) $files as $file) {
                    $path = $file->store("lead-documents/{$lead->id}", 'local');
                    \App\Models\LeadDocument::create([
                        'lead_id' => $lead->id,
                        'checklist_key' => (string) $bucket,
                        'original_name' => $file->getClientOriginalName(),
                        'file_path' => $path,
                        'mime' => $file->getClientMimeType(),
                        'size' => $file->getSize(),
                        'status' => \App\Models\LeadDocument::STATUS_SUBMITTED,
                        'source' => \App\Models\LeadDocument::SOURCE_UPLOAD,
                    ]);
                }
            }

            // Consultation bookings with a chosen slot get a Google Calendar
            // event + auto Meet link, then a confirmation email that includes
            // the Meet link. Event is created synchronously so the link is ready
            // for the email; both steps are best-effort.
            if (! empty($booking->appointment_at) && empty($booking->property_id)) {
                if (\App\Services\GoogleCalendarService::isConfigured()) {
                    try {
                        app(\App\Services\GoogleCalendarService::class)->createConsultationEvent($booking);
                        $booking->refresh();
                    } catch (\Throwable $e) {
                        Log::error('Booking calendar event (sync) failed', ['booking_id' => $booking->id, 'error' => $e->getMessage()]);
                    }
                }
                $this->sendBookingConfirmation($booking, $lead);
            }

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
