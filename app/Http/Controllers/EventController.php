<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\FacebookLiveSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EventController extends Controller
{
    /**
     * Return all events (with session counts) for the Events page.
     */
    public function index(Request $request)
    {
        $events = Event::with('sessions')->withCount(['sessions', 'leads'])->latest()->get();

        // Append the registration URL (and banner URL, if any) to each event
        $events->each(function ($event) {
            $event->registration_url = url('/register/'.$event->event_code);
            if ($event->banner_image) {
                $event->banner_image_url = Storage::disk('public')->url($event->banner_image);
            }
        });

        return inertia('admin/Events', [
            'events'              => $events,
            'defaultFormFields'   => Event::DEFAULT_FIELDS,
            'customFieldTypes'    => Event::CUSTOM_FIELD_TYPES,
            'lockedFieldKeys'     => Event::LOCKED_KEYS,
        ]);
    }

    /**
     * Show the detailed view for a single event (including leads).
     */
    public function show($id)
    {
        $event = Event::with('sessions')->findOrFail($id);

        // Optionally append the public URL for the banner image to be displayed in the overview
        if ($event->banner_image) {
            $event->banner_image_url = Storage::disk('public')->url($event->banner_image);
        }

        // Fetch leads that registered for this specific event
        $leads = $event->leads()->with(['studyPlans', 'educationExps', 'eventSession'])->latest()->get();

        return inertia('admin/EventDetails', [
            'event' => $event,
            'leads' => $leads,
        ]);
    }

    /**
     * Store a newly created event (with optional sessions) in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:100',
            'description' => 'nullable|string',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'status' => 'required|in:draft,upcoming,ongoing,completed,cancelled',
            'mode' => 'required|in:in-person,online,hybrid',
            'location' => 'nullable|string|max:255',
            'organizer_id' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'banner_image' => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:4096',
            // Custom registration-form schema. Null/missing = default fields.
            'form_fields'                 => 'nullable|array',
            'form_fields.*.key'           => 'required|string|max:60|regex:/^[a-z][a-z0-9_]*$/',
            'form_fields.*.label'         => 'required|string|max:120',
            'form_fields.*.type'          => 'required|string|in:text,email,tel,textarea,select,pills',
            'form_fields.*.required'      => 'nullable|boolean',
            'form_fields.*.locked'        => 'nullable|boolean',
            'form_fields.*.default'       => 'nullable|boolean',
            'form_fields.*.enabled'       => 'nullable|boolean',
            'form_fields.*.placeholder'   => 'nullable|string|max:200',
            'form_fields.*.hint'          => 'nullable|string|max:300',
            'form_fields.*.section'       => 'nullable|string|max:120',
            'form_fields.*.order'         => 'nullable|integer|min:0',
            'form_fields.*.options'       => 'nullable|array',
            'form_fields.*.options.*'     => 'string|max:120',
            // sessions are fully optional
            'sessions' => 'nullable|array',
            'sessions.*.venue_name' => 'nullable|string|max:255',
            'sessions.*.address' => 'nullable|string|max:500',
            'sessions.*.city' => 'nullable|string|max:100',
            'sessions.*.date' => 'nullable|date',
            'sessions.*.time_start' => 'nullable|date_format:H:i',
            'sessions.*.time_end' => 'nullable|date_format:H:i',
            'sessions.*.capacity' => 'nullable|integer|min:1',
            'sessions.*.status' => 'nullable|in:draft,upcoming,ongoing,completed,cancelled',
        ]);

        // Handle banner image upload
        if ($request->hasFile('banner_image')) {
            $validated['banner_image'] = $request->file('banner_image')->store('events/banners', 'public');
        }

        try {
            DB::beginTransaction();

            // Auto-generate a unique event_code from the name + random suffix
            $eventCode = Str::slug($validated['name']).'-'.strtolower(Str::random(5));

            $event = Event::create(array_merge($validated, [
                'event_code' => $eventCode,
            ]));

            // Sessions are optional — only create if provided
            if (! empty($validated['sessions'])) {
                foreach ($validated['sessions'] as $sessionData) {
                    $event->sessions()->create($sessionData);
                }
            }

            DB::commit();

            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('success', 'Event created successfully.');
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Event created successfully.',
                'data' => $event->load('sessions'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Event creation failed', ['error' => $e->getMessage()]);

            if ($request->header('X-Inertia')) {
                return redirect()->back()->withErrors(['message' => 'Failed to create event. Please try again.']);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create event. Please try again.',
            ], 500);
        }
    }

    /**
     * Update an existing event (and sync its sessions) in storage.
     */
    public function update(Request $request, $id)
    {
        $event = Event::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:100',
            'description' => 'nullable|string',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'status' => 'required|in:draft,upcoming,ongoing,completed,cancelled',
            'mode' => 'required|in:in-person,online,hybrid',
            'location' => 'nullable|string|max:255',
            'organizer_id' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'banner_image' => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:4096',
            // Custom registration-form schema. Null/missing = default fields.
            'form_fields'                 => 'nullable|array',
            'form_fields.*.key'           => 'required|string|max:60|regex:/^[a-z][a-z0-9_]*$/',
            'form_fields.*.label'         => 'required|string|max:120',
            'form_fields.*.type'          => 'required|string|in:text,email,tel,textarea,select,pills',
            'form_fields.*.required'      => 'nullable|boolean',
            'form_fields.*.locked'        => 'nullable|boolean',
            'form_fields.*.default'       => 'nullable|boolean',
            'form_fields.*.enabled'       => 'nullable|boolean',
            'form_fields.*.placeholder'   => 'nullable|string|max:200',
            'form_fields.*.hint'          => 'nullable|string|max:300',
            'form_fields.*.section'       => 'nullable|string|max:120',
            'form_fields.*.order'         => 'nullable|integer|min:0',
            'form_fields.*.options'       => 'nullable|array',
            'form_fields.*.options.*'     => 'string|max:120',
            'sessions' => 'nullable|array',
            'sessions.*.id' => 'nullable|integer',
            'sessions.*.venue_name' => 'nullable|string|max:255',
            'sessions.*.address' => 'nullable|string|max:500',
            'sessions.*.city' => 'nullable|string|max:100',
            'sessions.*.date' => 'nullable|date',
            'sessions.*.time_start' => 'nullable|date_format:H:i',
            'sessions.*.time_end' => 'nullable|date_format:H:i',
            'sessions.*.capacity' => 'nullable|integer|min:1',
            'sessions.*.status' => 'nullable|in:draft,upcoming,ongoing,completed,cancelled',
        ]);

        // Handle banner image upload — only replace when a new file is provided
        if ($request->hasFile('banner_image')) {
            if ($event->banner_image) {
                Storage::disk('public')->delete($event->banner_image);
            }
            $validated['banner_image'] = $request->file('banner_image')->store('events/banners', 'public');
        } else {
            unset($validated['banner_image']);
        }

        try {
            DB::beginTransaction();

            $sessions = $validated['sessions'] ?? null;
            unset($validated['sessions']);

            $event->update($validated);

            // Sync sessions only when the key is present in the request.
            // Existing sessions (matched by id) are updated, new ones created,
            // and removed ones deleted — except those that already have
            // registered leads, to avoid orphaning lead->session links.
            if ($request->has('sessions')) {
                $keepIds = [];

                foreach ($sessions ?? [] as $sessionData) {
                    $sessionId = $sessionData['id'] ?? null;
                    unset($sessionData['id']);

                    if ($sessionId) {
                        $session = $event->sessions()->find($sessionId);
                        if ($session) {
                            $session->update($sessionData);
                            $keepIds[] = $session->id;
                        }
                    } else {
                        $keepIds[] = $event->sessions()->create($sessionData)->id;
                    }
                }

                $event->sessions()
                    ->whereNotIn('id', $keepIds)
                    ->whereDoesntHave('leads')
                    ->delete();
            }

            DB::commit();

            return redirect()->back()->with('success', 'Event updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Event update failed', ['error' => $e->getMessage()]);

            return redirect()->back()->withErrors(['message' => 'Failed to update event. Please try again.']);
        }
    }

    /**
     * Remove an event (its banner, sessions, and lead links) from storage.
     */
    public function destroy($id)
    {
        $event = Event::findOrFail($id);

        try {
            DB::beginTransaction();

            // Detach any leads that registered for this event so we don't
            // delete the lead records themselves, just the event association.
            $event->leads()->update([
                'event_id' => null,
                'event_session_id' => null,
            ]);

            if ($event->banner_image) {
                Storage::disk('public')->delete($event->banner_image);
            }

            $event->sessions()->delete();
            $event->delete();

            DB::commit();

            return redirect()->back()->with('success', 'Event deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Event deletion failed', ['error' => $e->getMessage()]);

            return redirect()->back()->withErrors(['message' => 'Failed to delete event. Please try again.']);
        }
    }

    /**
     * Publicly show the registration form for a specific event.
     */
    public function showRegistrationForm($event_code)
    {
        $event = Event::with(['sessions' => function ($query) {
            $query->where('status', 'upcoming');
        }])->where('event_code', $event_code)->firstOrFail();

        // Append public URL for the banner image
        if ($event->banner_image) {
            $event->banner_image_url = Storage::disk('public')->url($event->banner_image);
        }

        // Hand the effective field schema to the React page so it can
        // render the form dynamically. Falls back to DEFAULT_FIELDS
        // when the event has no custom form_fields configured.
        $event->effective_fields = $event->effectiveFields();

        return inertia('registration/RegistrationPage', [
            'event' => $event,
        ]);
    }

    /**
     * Publicly register a lead for an event.
     */
    public function registerLead(Request $request, $event_code)
    {
        $event = Event::where('event_code', $event_code)->firstOrFail();

        // Build the dynamic validator from the event's effective field
        // schema. Locked keys (first_name / last_name / email / phone) are
        // always required regardless of admin config so the lead-follow-up
        // flow can never break.
        $fields = $event->effectiveFields();
        $rules  = ['event_session_id' => 'nullable|exists:event_sessions,id'];

        foreach ($fields as $f) {
            $enabled  = ($f['enabled'] ?? true) !== false;
            $locked   = ($f['locked']  ?? false) === true;
            $required = ($f['required']?? false) === true;
            if (! $enabled && ! $locked) continue;

            $rule = ($required || $locked) ? 'required' : 'nullable';
            $rule .= '|' . match ($f['type'] ?? 'text') {
                'email'    => 'email|max:255',
                'tel'      => 'string|max:40',
                'textarea' => 'string|max:5000',
                'select', 'pills' => isset($f['options']) && count($f['options']) > 0
                    ? 'string|in:'.implode(',', $f['options'])
                    : 'string|max:255',
                default    => 'string|max:255',
            };
            $rules[$f['key']] = $rule;
        }

        $validated = $request->validate($rules);

        try {
            DB::beginTransaction();

            // 1. Find-or-create the Lead through the unified intake —
            // repeat registrants by the same email are de-duped (a
            // 'lead.resubmitted' activity entry gets appended instead).
            $intake = app(\App\Services\LeadIntakeService::class);
            $lead = $intake->ingest("event:{$event->event_code}", array_filter([
                'first_name' => $validated['first_name'] ?? null,
                'last_name'  => $validated['last_name']  ?? null,
                'email'      => $validated['email']      ?? null,
                'phone'      => $validated['phone']      ?? null,
                'country'    => $validated['country']    ?? null,
                'stage'      => $validated['interest']   ?? null,
            ], fn ($v) => ! is_null($v) && $v !== ''), $request);

            // Split responses into "known" (mapped to dedicated columns
            // on the lead / its related rows) and "custom" (everything
            // else — lands in lead.event_response JSON). The known set
            // matches Event::DEFAULT_FIELDS so newly-added custom fields
            // automatically take the JSON path.
            $knownKeys = array_column(\App\Models\Event::DEFAULT_FIELDS, 'key');
            $customResponses = collect($validated)
                ->except(array_merge($knownKeys, ['event_session_id']))
                ->all();

            // Attach event-level + work + financial context. Only fields
            // that were actually submitted contribute — null/missing
            // entries fall through array_filter and don't overwrite
            // anything the lead already had.
            $workInfo = array_filter([
                'employment_status' => $validated['employment_status'] ?? null,
                'city'              => $validated['city']              ?? null,
                'remarks'           => $validated['remarks']           ?? null,
            ], fn ($v) => ! is_null($v) && $v !== '');

            $financialInfo = array_filter([
                'funding_source' => $validated['funding_source'] ?? null,
            ], fn ($v) => ! is_null($v) && $v !== '');

            $eventAttrs = array_filter([
                'branch'           => $lead->branch ?: 'Online Registration',
                'event_id'         => $event->id,
                'event_session_id' => $validated['event_session_id'] ?? null,
                'work_info'        => $lead->work_info      ?: ($workInfo      ?: null),
                'financial_info'   => $lead->financial_info ?: ($financialInfo ?: null),
                'event_response'   => $customResponses ?: null,
            ], fn ($v) => ! is_null($v));
            $lead->update($eventAttrs);

            // 2. Add Education Experience — only when the relevant
            // default fields were submitted.
            if (! empty($validated['education_level']) || ! empty($validated['field_of_study'])) {
                $lead->educationExps()->create([
                    'level'          => $validated['education_level']  ?? null,
                    'field_of_study' => $validated['field_of_study']   ?? null,
                    'institution'    => 'N/A',
                ]);
            }

            // 3. Add Study Plan — same gating.
            if (! empty($validated['interest']) || ! empty($validated['planning_timeline'])) {
                $lead->studyPlans()->create([
                    'preferred_course'    => $validated['interest']           ?? null,
                    'preferred_intake'    => $validated['planning_timeline']  ?? null,
                    'preferred_city'      => 'New Zealand',
                    'qualification_level' => $validated['education_level']    ?? null,
                ]);
            }

            DB::commit();

            if ($request->header('X-Inertia') || ! $request->wantsJson()) {
                return redirect()->back()->with('success', 'Registration successful! We will contact you soon.');
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Registration successful! We will contact you soon.',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Public registration failed', ['error' => $e->getMessage()]);

            if ($request->header('X-Inertia') || ! $request->wantsJson()) {
                return redirect()->back()->withErrors(['error' => 'Registration failed. Please try again later.']);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Registration failed. Please try again later.',
            ], 500);
        }
    }

    /**
     * Publicly list all upcoming and ongoing events.
     */
    public function activities()
    {
        $events = Event::with('sessions')
            ->whereIn('status', ['upcoming', 'ongoing'])
            ->latest()
            ->get();

        $events->each(function ($event) {
            $event->registration_url = url('/register/'.$event->event_code);
        });

        $today = today()->toDateString();

        $featuredSession = FacebookLiveSession::whereDate('session_date', '>=', $today)
            ->orderBy('session_date', 'asc')
            ->first();

        $pastSessions = FacebookLiveSession::whereDate('session_date', '<', $today)
            ->orderBy('session_date', 'desc')
            ->get();

        if (! $featuredSession && $pastSessions->isNotEmpty()) {
            $featuredSession = $pastSessions->shift();
        }

        return inertia('activities/ActivitiesPage', [
            'events' => $events,
            'pastSessions' => $pastSessions->values(),
            'featuredSession' => $featuredSession,
        ]);
    }
}
