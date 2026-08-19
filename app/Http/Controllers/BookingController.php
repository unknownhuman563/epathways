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
            // Canonical pipeline stages — the STAGE column dropdown reuses
            // these so it matches the Leads list exactly.
            'stages' => \App\Models\Lead::STAGES,
        ]);
    }

    /**
     * Busy intervals on the consultant's Google Calendar for a date range, so
     * the public booking page can hide already-taken slots. Fails open (empty)
     * when Calendar isn't configured.
     */
    public function busyTimes(Request $request)
    {
        $data = $request->validate([
            'from' => 'required|date',
            'to' => 'required|date|after:from',
        ]);

        $busy = app(\App\Services\GoogleCalendarService::class)->busyPeriods(
            \Illuminate\Support\Carbon::parse($data['from']),
            \Illuminate\Support\Carbon::parse($data['to']),
        );

        return response()->json(['busy' => $busy]);
    }

    /**
     * Reschedule flow — opened from the "Reschedule" button in a booking email.
     * The token identifies the booking, so the booking page renders in
     * reschedule mode: no intake form (the client is already on record), just
     * the slot picker for their existing consultant.
     */
    public function reschedulePage(string $token)
    {
        $booking = Booking::where('manage_token', $token)->firstOrFail();

        if (in_array(strtolower((string) $booking->status), ['cancelled', 'canceled'], true)) {
            return Inertia::render('booking/CancelBooking', [
                'booking' => $this->bookingBrief($booking),
                'alreadyCancelled' => true,
            ]);
        }

        return Inertia::render('booking/BookingPage', [
            'visaTypes' => [],
            'availability' => (object) [],
            'bookingTimezone' => config('services.booking.timezone', 'Pacific/Auckland'),
            'reschedule' => [
                'token' => $booking->manage_token,
                'consultant_name' => $booking->consultant_name,
                'service_type' => $booking->service_type,
                'first_name' => $booking->first_name,
                'client_timezone' => $booking->client_timezone,
                'current_date' => optional($booking->appointment_date)->toDateString(),
                'current_time' => $booking->appointment_time,
            ],
        ]);
    }

    /** Persist a rescheduled slot: move the booking + Google event, re-notify. */
    public function reschedule(Request $request, string $token)
    {
        $booking = Booking::where('manage_token', $token)->firstOrFail();

        $data = $request->validate([
            'appointment_date' => 'required|date',
            'appointment_time' => 'required|string|max:50',
            'appointment_at' => 'nullable|date',
            'client_timezone' => 'nullable|string|max:64',
        ]);

        $booking->fill([
            'appointment_date' => $data['appointment_date'],
            'appointment_time' => $data['appointment_time'],
            'appointment_at' => $data['appointment_at'] ?? $booking->appointment_at,
            'client_timezone' => $data['client_timezone'] ?: $booking->client_timezone,
            'status' => 'Confirmed',
        ])->save();

        try {
            app(\App\Services\GoogleCalendarService::class)->updateConsultationEvent($booking->fresh());
        } catch (\Throwable $e) {
            Log::warning('Reschedule calendar move failed', ['booking_id' => $booking->id, 'error' => $e->getMessage()]);
        }

        $notifier = app(\App\Services\BookingNotificationService::class);
        $notifier->sendTemplateKey($booking, 'reschedule_booking');
        $notifier->scheduleReminders($booking);

        if ($request->wantsJson()) {
            return response()->json(['ok' => true]);
        }

        return redirect()->route('booking.reschedule', $token)->with('success', 'Your consultation has been rescheduled.');
    }

    /** Cancel flow — GET confirmation page (so a prefetch can't cancel). */
    public function cancelPage(string $token)
    {
        $booking = Booking::where('manage_token', $token)->firstOrFail();

        return Inertia::render('booking/CancelBooking', [
            'booking' => $this->bookingBrief($booking),
            'token' => $token,
            'alreadyCancelled' => in_array(strtolower((string) $booking->status), ['cancelled', 'canceled'], true),
        ]);
    }

    /** Confirm cancel: mark cancelled, delete the Google event, notify. */
    public function cancel(Request $request, string $token)
    {
        $booking = Booking::where('manage_token', $token)->firstOrFail();

        if (! in_array(strtolower((string) $booking->status), ['cancelled', 'canceled'], true)) {
            $booking->update(['status' => 'Cancelled']);

            try {
                app(\App\Services\GoogleCalendarService::class)->cancelConsultationEvent($booking);
            } catch (\Throwable $e) {
                Log::warning('Cancel calendar delete failed', ['booking_id' => $booking->id, 'error' => $e->getMessage()]);
            }

            $notifier = app(\App\Services\BookingNotificationService::class);
            $notifier->sendTemplateKey($booking, 'cancel_booking');
            $notifier->cancelReminders($booking);
        }

        return Inertia::render('booking/CancelBooking', [
            'booking' => $this->bookingBrief($booking->fresh()),
            'alreadyCancelled' => true,
            'justCancelled' => true,
        ]);
    }

    /** Delete a booking record (admin cleanup) + its calendar event + reminders. */
    public function destroy($id)
    {
        $booking = Booking::findOrFail($id);

        // Remove the Google Calendar event too — silently (no client email),
        // since this is an admin cleanup, not a client-facing cancellation.
        try {
            app(\App\Services\GoogleCalendarService::class)->cancelConsultationEvent($booking, false);
        } catch (\Throwable $e) {
            Log::warning('Delete booking calendar cleanup failed', ['booking_id' => $booking->id, 'error' => $e->getMessage()]);
        }

        // Drop any pending reminders so they don't fire for a removed booking.
        \App\Models\BookingReminder::where('booking_id', $booking->id)->delete();

        $booking->delete();

        return redirect()->back()->with('success', 'Booking deleted.');
    }

    /** Compact booking summary for the reschedule / cancel client pages. */
    private function bookingBrief(Booking $booking): array
    {
        return [
            'first_name' => $booking->first_name,
            'service_type' => $booking->service_type,
            'consultant_name' => $booking->consultant_name,
            'appointment_date' => optional($booking->appointment_date)->toDateString(),
            'appointment_time' => $booking->appointment_time,
        ];
    }

    /**
     * Convert a booking's client into a pipeline lead. Bookings are standalone
     * by default — staff click "Convert" on the Bookings list to promote the
     * client into Leads (education flow). Find-or-create by email (dedupe),
     * then land them on the "Booking Confirmation with Bryll" stage. Idempotent:
     * a booking already linked to a lead just returns it.
     */
    public function convertToLead(Request $request, $id)
    {
        $booking = Booking::with('lead')->findOrFail($id);

        if ($booking->lead_id && $booking->lead) {
            return response()->json([
                'message' => 'Already linked to a lead.',
                'lead' => $this->leadBrief($booking->lead),
            ]);
        }

        if (empty($booking->email) && empty($booking->first_name)) {
            return response()->json(['message' => 'This booking has no client details to convert.'], 422);
        }

        try {
            $lead = app(LeadIntakeService::class)->ingest('booking', [
                'first_name' => $booking->first_name,
                'last_name' => $booking->last_name,
                'email' => $booking->email,
                'phone' => $booking->phone,
                'country' => $booking->current_country,
                'stage' => 'Booking',
            ], $request);

            // Land on the booking-confirmed stage. Non-regressing: never pull a
            // lead that's already further along back to this stage.
            $preBookingStages = ['New Leads', 'Contact Attempted', 'Contacted for Booking'];
            if ($lead->wasRecentlyCreated || $lead->status === null || in_array($lead->status, $preBookingStages, true)) {
                $lead->status = 'Booking Confirmation with Bryll';
            }

            // Carry the intake scalars onto the lead when the booking has them.
            if (is_array($booking->intake)) {
                foreach ([
                    'age' => 'age', 'gender' => 'gender', 'civil_status' => 'marital_status',
                    'city' => 'residence_city', 'current_location' => 'residence_country',
                    'country_of_origin' => 'country_of_birth',
                ] as $src => $col) {
                    if (! empty($booking->intake[$src])) {
                        $lead->{$col} = $booking->intake[$src];
                    }
                }
            }
            $lead->save();

            $booking->lead_id = $lead->id;
            $booking->save();

            return response()->json([
                'message' => "Converted {$booking->first_name} to a lead.",
                'lead' => $this->leadBrief($lead),
            ]);
        } catch (\Throwable $e) {
            Log::error('Booking convert-to-lead failed', ['booking_id' => $id, 'error' => $e->getMessage()]);

            return response()->json(['message' => 'Could not convert this booking to a lead.'], 500);
        }
    }

    /** Compact lead payload so the Bookings table can update the row in place. */
    private function leadBrief(\App\Models\Lead $lead): array
    {
        return [
            'id' => $lead->id,
            'lead_id' => $lead->lead_id,
            'status' => $lead->status,
        ];
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

            // A confirmed booking moves the lead into the "Booking Confirmation
            // with Bryll" pipeline stage so it reads the same as the Leads list.
            // Only advance freshly-created leads or ones still in the early
            // pre-booking stages — never regress a lead that's further along.
            $preBookingStages = ['New Leads', 'Contact Attempted', 'Contacted for Booking'];
            if ($lead->wasRecentlyCreated || $lead->status === null || in_array($lead->status, $preBookingStages, true)) {
                $lead->status = 'Booking Confirmation with Bryll';
                $lead->save();
            }

            $validated['lead_id'] = $lead->id;
            $validated['payment_status'] = Booking::PAYMENT_UNPAID;

            // Idempotency guard. A double-clicked button, a slow-response retry,
            // or a booking widget that re-fires its completion event must NOT
            // create a second identical booking. Reuse an existing booking for
            // the same lead + service + slot and return it WITHOUT re-running the
            // calendar/email side-effects. The DB unique index is the hard
            // backstop for the concurrent-submit race below.
            if ($existing = $this->findDuplicateBooking($lead->id, $validated)) {
                return response()->json([
                    'message' => 'Booking already recorded',
                    'booking_id' => $existing->id,
                    'duplicate' => true,
                ], 200);
            }

            try {
                $booking = Booking::create($validated);
            } catch (\Illuminate\Database\QueryException $e) {
                // Two near-simultaneous submits raced past the check above; the
                // unique index rejected the loser. Reuse the row that won instead
                // of erroring the visitor.
                if ($dup = $this->findDuplicateBooking($lead->id, $validated)) {
                    return response()->json([
                        'message' => 'Booking already recorded',
                        'booking_id' => $dup->id,
                        'duplicate' => true,
                    ], 200);
                }
                throw $e;
            }

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
                // Confirmation email now (booking_confirmation_1) + schedule the
                // future reminders (2..5) based on the appointment time.
                $notifier = app(\App\Services\BookingNotificationService::class);
                $notifier->sendTemplateKey($booking, 'booking_confirmation_1');
                $notifier->scheduleReminders($booking);
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

    /**
     * Find an existing booking that a repeat submit would duplicate: same lead,
     * same service, same chosen slot. For slot-less enquiries (no date/time) only
     * a recent identical submit counts as a duplicate, so a genuine later
     * re-enquiry can still book. Returns the matching booking or null.
     */
    private function findDuplicateBooking(int $leadId, array $data): ?Booking
    {
        $date = $data['appointment_date'] ?? null;
        $time = $data['appointment_time'] ?? null;

        $query = Booking::where('lead_id', $leadId)
            ->where('service_type', $data['service_type'] ?? null);

        if ($date || $time) {
            // whereDate normalises the comparison so a stored "2026-08-19 00:00:00"
            // still matches the submitted "2026-08-19" on every DB driver.
            $query->when(
                $date,
                fn ($q) => $q->whereDate('appointment_date', $date),
                fn ($q) => $q->whereNull('appointment_date'),
            )->where('appointment_time', $time);
        } else {
            $query->whereNull('appointment_date')->whereNull('appointment_time')
                ->where('created_at', '>=', now()->subMinutes(10));
        }

        return $query->latest('id')->first();
    }

    public function update(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);

        $validated = $request->validate([
            'appointment_date' => 'nullable|date',
            'appointment_time' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:50',
        ]);

        // Snapshot before the change so we can detect status / reschedule.
        $oldStatus = strtolower((string) $booking->status);
        $oldDate = optional($booking->appointment_date)->toDateString();
        $oldTime = $booking->appointment_time;

        // If the appointment moved, recompute the absolute instant (so reminders
        // re-schedule correctly) when the time parses to a single value.
        if (! empty($validated['appointment_date'])) {
            $firstTime = trim(explode('-', (string) ($validated['appointment_time'] ?? ''))[0]);
            $ts = strtotime($validated['appointment_date'].' '.$firstTime);
            if ($ts !== false && $firstTime !== '') {
                $tz = $booking->client_timezone ?: config('app.timezone', 'UTC');
                $validated['appointment_at'] = \Illuminate\Support\Carbon::parse($validated['appointment_date'].' '.$firstTime, $tz)->utc();
            }
        }

        $booking->update($validated);
        $booking->refresh();

        // Transactional emails on a consultation booking's lifecycle changes.
        $newStatus = strtolower((string) $booking->status);
        $isConsult = empty($booking->property_id) && ! empty($booking->email);
        if ($isConsult) {
            $notifier = app(\App\Services\BookingNotificationService::class);

            if ($newStatus !== $oldStatus) {
                if (in_array($newStatus, ['cancelled', 'canceled'], true)) {
                    $notifier->sendTemplateKey($booking, 'cancel_booking');
                    $notifier->cancelReminders($booking);
                } elseif (in_array($newStatus, ['missed', 'no show', 'no-show'], true)) {
                    $notifier->sendTemplateKey($booking, 'missed_the_booking_1');
                    $notifier->scheduleMissedFollowup($booking);
                }
            }

            // Reschedule: appointment moved while still active.
            $apptChanged = optional($booking->appointment_date)->toDateString() !== $oldDate
                || $booking->appointment_time !== $oldTime;
            if ($apptChanged && ! in_array($newStatus, ['cancelled', 'canceled', 'missed', 'no show', 'no-show', 'completed'], true)) {
                $notifier->sendTemplateKey($booking, 'reschedule_booking');
                $notifier->scheduleReminders($booking);
            }
        }

        return redirect()->back()->with('success', 'Booking updated successfully');
    }
}
