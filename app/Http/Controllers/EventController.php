<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\FacebookLiveSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
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

        // Append the registration URL to each event
        $events->each(function ($event) {
            $event->registration_url = url('/register/' . $event->event_code);
        });

        return inertia('admin/Events', [
            'events' => $events
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
            'leads' => $leads
        ]);
    }

    /**
     * Store a newly created event (with optional sessions) in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'              => 'required|string|max:255',
            'type'              => 'required|string|max:100',
            'description'       => 'nullable|string',
            'date_from'         => 'nullable|date',
            'date_to'           => 'nullable|date|after_or_equal:date_from',
            'status'            => 'required|in:draft,upcoming,ongoing,completed,cancelled',
            'mode'              => 'required|in:in-person,online,hybrid',
            'organizer_id'      => 'nullable|string|max:255',
            'notes'             => 'nullable|string',
            'banner_image'      => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:4096',
            // sessions are fully optional
            'sessions'                  => 'nullable|array',
            'sessions.*.venue_name'     => 'nullable|string|max:255',
            'sessions.*.address'        => 'nullable|string|max:500',
            'sessions.*.city'           => 'nullable|string|max:100',
            'sessions.*.date'           => 'nullable|date',
            'sessions.*.time_start'     => 'nullable|date_format:H:i',
            'sessions.*.time_end'       => 'nullable|date_format:H:i',
            'sessions.*.capacity'       => 'nullable|integer|min:1',
            'sessions.*.status'         => 'nullable|in:draft,upcoming,ongoing,completed,cancelled',
        ]);

        // Handle banner image upload
        if ($request->hasFile('banner_image')) {
            $validated['banner_image'] = $request->file('banner_image')->store('events/banners', 'public');
        }

        try {
            DB::beginTransaction();

            // Auto-generate a unique event_code from the name + random suffix
            $eventCode = Str::slug($validated['name']) . '-' . strtolower(Str::random(5));

            $event = Event::create(array_merge($validated, [
                'event_code' => $eventCode,
            ]));

            // Sessions are optional — only create if provided
            if (!empty($validated['sessions'])) {
                foreach ($validated['sessions'] as $sessionData) {
                    $event->sessions()->create($sessionData);
                }
            }

            DB::commit();

            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('success', 'Event created successfully.');
            }

            return response()->json([
                'status'  => 'success',
                'message' => 'Event created successfully.',
                'data'    => $event->load('sessions'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Event creation failed', ['error' => $e->getMessage()]);

            if ($request->header('X-Inertia')) {
                return redirect()->back()->withErrors(['message' => 'Failed to create event. Please try again.']);
            }

            return response()->json([
                'status'  => 'error',
                'message' => 'Failed to create event. Please try again.',
            ], 500);
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

        return inertia('registration/RegistrationPage', [
            'event' => $event
        ]);
    }

    /**
     * Publicly register a lead for an event.
     */
    public function registerLead(Request $request, $event_code)
    {
        $event = Event::where('event_code', $event_code)->firstOrFail();

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'city' => 'required|string|max:100',
            'country' => 'required|string|max:100',
            'employment_status' => 'required|string',
            'interest' => 'required|string',
            'education_level' => 'required|string',
            'field_of_study' => 'required|string',
            'planning_timeline' => 'required|string',
            'funding_source' => 'required|string',
            'event_session_id' => 'nullable|exists:event_sessions,id',
            'remarks' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            // 1. Create Lead
            $lead = \App\Models\Lead::create([
                'lead_id' => 'LP-' . rand(10000, 99999),
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'country' => $validated['country'],
                'phone' => $validated['phone'],
                'branch' => 'Online Registration',
                'status' => 'New',
                'stage' => $validated['interest'],
                'work_info' => [
                    'employment_status' => $validated['employment_status'],
                    'city' => $validated['city'],
                    'remarks' => $validated['remarks'] ?? null,
                ],
                'financial_info' => [
                    'funding_source' => $validated['funding_source']
                ],
                'event_id' => $event->id,
                'event_session_id' => $validated['event_session_id'] ?? null,
            ]);

            // 2. Add Education Experience
            $lead->educationExps()->create([
                'level' => $validated['education_level'],
                'field_of_study' => $validated['field_of_study'],
                'institution' => 'N/A', // Collected during follow-up
            ]);

            // 3. Add Study Plan
            $lead->studyPlans()->create([
                'preferred_course' => $validated['interest'],
                'preferred_intake' => $validated['planning_timeline'],
                'preferred_city' => 'New Zealand', // Default focus as per request
                'qualification_level' => $validated['education_level'],
            ]);

            DB::commit();

            if ($request->header('X-Inertia') || !$request->wantsJson()) {
                return redirect()->back()->with('success', 'Registration successful! We will contact you soon.');
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Registration successful! We will contact you soon.'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Public registration failed', ['error' => $e->getMessage()]);

            if ($request->header('X-Inertia') || !$request->wantsJson()) {
                return redirect()->back()->withErrors(['error' => 'Registration failed. Please try again later.']);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Registration failed. Please try again later.'
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
            $event->registration_url = url('/register/' . $event->event_code);
        });

        $today = today()->toDateString();

        $featuredSession = FacebookLiveSession::whereDate('session_date', '>=', $today)
            ->orderBy('session_date', 'asc')
            ->first();

        $pastSessions = FacebookLiveSession::whereDate('session_date', '<', $today)
            ->orderBy('session_date', 'desc')
            ->get();

        if (!$featuredSession && $pastSessions->isNotEmpty()) {
            $featuredSession = $pastSessions->shift();
        }

        return inertia('activities/ActivitiesPage', [
            'events'          => $events,
            'pastSessions'    => $pastSessions->values(),
            'featuredSession' => $featuredSession,
        ]);
    }
}
