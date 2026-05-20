<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Event;
use App\Models\FacebookLiveSession;
use App\Models\Lead;
use App\Models\LeadDocument;
use App\Services\NewsFeedService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

/**
 * Client-facing Leads Portal — scoped to the lead-role user's own Lead
 * record. The portal middleware ('portal:lead') enforces role; this
 * controller enforces record-level scope (`$user->lead`).
 *
 * All public-facing data (events, news, Facebook Lives) is reused from the
 * same models the marketing site renders — leads see authoritative content
 * without us maintaining a parallel data set.
 */
class LeadPortalController extends Controller
{
    /** Premium overview — hero, submissions summary, upcoming activity teaser,
     *  latest announcement teaser. */
    public function dashboard()
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) {
            return $lead;
        }

        return inertia('portal/lead/Dashboard', [
            'lead'              => $this->leadPayload($lead),
            'submissionsCounts' => $this->submissionsCounts($lead),
            'nextActivity'      => $this->upcomingEvents()->first(),
            'latestAnnouncement'=> $this->announcementFeed(1)->first(),
            'documentSummary'   => $this->documentSummary($lead),
        ]);
    }

    /** Full submissions timeline — every form the lead has signed against. */
    public function submissions()
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) {
            return $lead;
        }

        return inertia('portal/lead/Submissions', [
            'lead'        => $this->leadPayload($lead),
            'submissions' => $this->submissionsTimeline($lead),
        ]);
    }

    /** Upcoming + past activities the lead can join. */
    public function activities()
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) {
            return $lead;
        }

        return inertia('portal/lead/Activities', [
            'lead'             => $this->leadPayload($lead),
            'upcoming'         => $this->upcomingEvents(20),
            'past'             => $this->pastEvents(10),
            'registeredEventId'=> $lead->event_id,
        ]);
    }

    /** Announcements page — Facebook Live sessions + auto-fetched migration news. */
    public function announcements()
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) {
            return $lead;
        }

        return inertia('portal/lead/Announcements', [
            'lead'           => $this->leadPayload($lead),
            'facebookLives'  => $this->facebookLives(8),
            'news'           => NewsFeedService::latest(6),
        ]);
    }

    // ── Internals ───────────────────────────────────────────────────────────

    /** Defensive: a role='lead' user without a linked Lead is a broken state. */
    private function resolveLeadOrLogout()
    {
        $user = Auth::user();
        $lead = $user?->lead;

        if (! $lead) {
            Auth::logout();
            return redirect('/login')->withErrors([
                'email' => 'Portal account is not linked to a lead record. Please contact ePathways.',
            ]);
        }

        return $lead;
    }

    private function leadPayload(Lead $lead): array
    {
        return [
            'lead_id'           => $lead->lead_id,
            'first_name'        => $lead->first_name,
            'last_name'         => $lead->last_name,
            'email'             => $lead->email,
            'phone'             => $lead->phone,
            'residence_country' => $lead->residence_country,
            'stage'             => $lead->stage,
            'status'            => $lead->status,
            'created_at'        => $lead->created_at,
        ];
    }

    /** Summary tile counts surfaced on the Dashboard. */
    private function submissionsCounts(Lead $lead): array
    {
        $assessmentSubmitted = str_starts_with((string) $lead->lead_id, 'FA-')
            || $lead->source === 'free-assessment';

        return [
            'assessment_submitted' => $assessmentSubmitted,
            'ai_status'            => $lead->ai_analysis_status,
            'bookings'             => Booking::where('email', $lead->email)->count(),
            'event_registered'     => (bool) $lead->event_id,
        ];
    }

    private function documentSummary(Lead $lead): array
    {
        $docs = LeadDocument::where('lead_id', $lead->id)->get();
        return [
            'total'    => $docs->count(),
            'pending'  => $docs->where('status', 'Submitted')->count(),
            'approved' => $docs->where('status', 'Approved')->count(),
            'rejected' => $docs->where('status', 'Rejected')->count(),
        ];
    }

    /** Full chronological history of the lead's interactions. */
    private function submissionsTimeline(Lead $lead): array
    {
        $items = collect();

        // Free Assessment — implied by lead_id prefix or source tag.
        if (str_starts_with((string) $lead->lead_id, 'FA-') || $lead->source === 'free-assessment') {
            $items->push([
                'type'        => 'free_assessment',
                'title'       => 'Free Assessment Submitted',
                'subtitle'    => 'Eligibility profile · '.($lead->stage ?: 'Evaluation'),
                'status'      => $lead->ai_analysis_status === 'completed' ? 'Reviewed' : 'In review',
                'status_tone' => $lead->ai_analysis_status === 'completed' ? 'success' : 'pending',
                'reference'   => $lead->lead_id,
                'date'        => optional($lead->created_at)->toIso8601String(),
                'cta_label'   => $lead->ai_analysis_status === 'completed' ? 'View result' : null,
                'cta_href'    => $lead->ai_analysis_status === 'completed'
                    ? route('assessment-result', ['lead_id' => $lead->lead_id])
                    : null,
            ]);
        }

        // Bookings — matched by email.
        Booking::where('email', $lead->email)
            ->orderByDesc('created_at')
            ->get()
            ->each(function (Booking $b) use ($items) {
                $items->push([
                    'type'        => 'booking',
                    'title'       => '1:1 Consultation Booked',
                    'subtitle'    => trim(($b->service_type ?: 'Consultation').' · '.($b->consultant_name ?: 'Adviser TBD')),
                    'status'      => $b->status ?: 'Pending',
                    'status_tone' => match ($b->status) {
                        'Confirmed' => 'success', 'Completed' => 'success',
                        'Cancelled' => 'muted',
                        default     => 'pending',
                    },
                    'reference'   => 'BK-'.$b->id,
                    'date'        => optional($b->created_at)->toIso8601String(),
                    'detail'      => $b->appointment_date
                        ? 'Appointment: '.\Illuminate\Support\Carbon::parse($b->appointment_date)->toFormattedDateString()
                            .($b->appointment_time ? ' · '.$b->appointment_time : '')
                        : null,
                ]);
            });

        // Event registration — leads.event_id link.
        if ($lead->event_id && $lead->event) {
            $event = $lead->event;
            $items->push([
                'type'        => 'event_registration',
                'title'       => 'Registered for '.$event->name,
                'subtitle'    => trim(($event->type ?: 'Event').' · '.($event->mode ?: 'In-person')),
                'status'      => 'Registered',
                'status_tone' => 'success',
                'reference'   => $event->event_code,
                'date'        => optional($lead->created_at)->toIso8601String(),
                'detail'      => $event->date_from ? 'On '.$event->date_from->toFormattedDateString() : null,
            ]);
        }

        return $items
            ->sortByDesc('date')
            ->values()
            ->all();
    }

    private function upcomingEvents(int $limit = 6)
    {
        return Event::where('status', 'active')
            ->whereDate('date_from', '>=', now()->toDateString())
            ->orderBy('date_from')
            ->limit($limit)
            ->get()
            ->map(fn (Event $e) => $this->eventPayload($e));
    }

    private function pastEvents(int $limit = 10)
    {
        return Event::whereDate('date_from', '<', now()->toDateString())
            ->orderByDesc('date_from')
            ->limit($limit)
            ->get()
            ->map(fn (Event $e) => $this->eventPayload($e));
    }

    private function eventPayload(Event $e): array
    {
        return [
            'id'           => $e->id,
            'event_code'   => $e->event_code,
            'name'         => $e->name,
            'description'  => $e->description,
            'type'         => $e->type,
            'mode'         => $e->mode,
            'date_from'    => optional($e->date_from)->toIso8601String(),
            'date_to'      => optional($e->date_to)->toIso8601String(),
            'banner_url'   => $e->banner_image ? Storage::disk('public')->url($e->banner_image) : null,
            'register_href'=> $e->registration_link ?: ($e->event_code ? "/register/{$e->event_code}" : null),
        ];
    }

    private function facebookLives(int $limit = 6)
    {
        return FacebookLiveSession::orderByDesc('session_date')
            ->limit($limit)
            ->get()
            ->map(fn (FacebookLiveSession $s) => [
                'id'           => $s->id,
                'title'        => $s->title,
                'description'  => $s->description,
                'fb_link'      => $s->fb_link,
                'image_url'    => $s->image_url,
                'session_date' => optional($s->session_date)->toIso8601String(),
                'is_upcoming'  => $s->session_date && $s->session_date->gte(now()->startOfDay()),
            ]);
    }

    /** Unified announcements feed used by the Dashboard teaser:
     *  Facebook Live sessions first (own content), then news headlines. */
    private function announcementFeed(int $limit)
    {
        $live = $this->facebookLives(2)->take(1)->map(fn ($s) => [
            'kind'    => 'facebook_live',
            'title'   => $s['title'],
            'subtitle'=> $s['is_upcoming'] ? 'Upcoming Facebook Live' : 'Recent Facebook Live',
            'date'    => $s['session_date'],
            'href'    => $s['fb_link'] ?: '/portal/lead/announcements',
        ]);

        $news = collect(NewsFeedService::latest(1))->map(fn ($n) => [
            'kind'    => 'news',
            'title'   => $n['title'],
            'subtitle'=> $n['source'] ?: 'NZ migration news',
            'date'    => $n['published_at'],
            'href'    => $n['link'],
        ]);

        return $live->concat($news)->take($limit);
    }
}
