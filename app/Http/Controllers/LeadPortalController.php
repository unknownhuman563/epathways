<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Event;
use App\Models\FacebookLiveSession;
use App\Models\Lead;
use App\Models\LeadDocument;
use App\Services\LeadPhaseService;
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

    /** Vertical timeline of every engagement step + current expanded. */
    public function journey()
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) return $lead;

        return inertia('portal/lead/Journey', [
            'lead'         => $this->leadPayload($lead),
            'roadmap'      => LeadPhaseService::roadmap($lead->status),
            'currentPhase' => LeadPhaseService::phaseFor($lead->status),
            'preEngagement'=> LeadPhaseService::isPreEngagement($lead->status),
            'submissions'  => $this->submissionsTimeline($lead),
        ]);
    }

    /** Checklist view — uses the same document_checklist + section verifications. */
    public function checklist()
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) return $lead;

        return inertia('portal/lead/Checklist', [
            'lead'                 => $this->leadPayload($lead),
            'documentChecklist'    => $lead->document_checklist ?? [],
            'sectionVerifications' => $lead->section_verifications ?? [],
        ]);
    }

    /** INZ forms the case sent this client to fill — with a preview + fields. */
    public function visaForms()
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) {
            return $lead;
        }

        $filler = app(\App\Services\Immigration\InzFormFiller::class);
        $context = \App\Services\Immigration\InzCaseContext::for($lead);

        $forms = \App\Models\CaseFormAssignment::where('lead_id', $lead->id)
            ->with(['form', 'version'])
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (\App\Models\CaseFormAssignment $a) => [
                'id' => $a->id,
                'code' => $a->form->code,
                'name' => $a->form->name,
                'version' => $a->version?->version_label,
                'status' => $a->status,
                'ready' => $a->version?->isReady() ?? false,
                'preview_url' => ($a->version && $a->version->isReady()) ? "/portal/lead/visa-forms/{$a->id}/preview" : null,
                'fields' => $a->version ? $filler->clientFields($a->version, $context, $a->field_values ?? []) : [],
                'submitted_at' => optional($a->submitted_at)->toIso8601String(),
            ]);

        return inertia('portal/lead/VisaForms', ['lead' => $this->leadPayload($lead), 'forms' => $forms]);
    }

    /** Client submits their filled answers for an assigned INZ form. */
    public function visaFormSubmit(\Illuminate\Http\Request $request, int $id)
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) {
            return $lead;
        }

        $assignment = \App\Models\CaseFormAssignment::where('id', $id)->where('lead_id', $lead->id)->firstOrFail();

        $data = $request->validate([
            'field_values' => 'present|array',
            'field_values.*' => 'nullable|string|max:2000',
        ]);

        $assignment->forceFill([
            'field_values' => $data['field_values'],
            'status' => 'submitted',
            'submitted_at' => now(),
        ])->save();

        return back()->with('success', 'Submitted — your adviser will review it.');
    }

    /** Stream the official INZ PDF for an assigned form (preview, client-owned). */
    public function visaFormPreview(int $id)
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) {
            return $lead;
        }

        $assignment = \App\Models\CaseFormAssignment::where('id', $id)->where('lead_id', $lead->id)->firstOrFail();
        $version = $assignment->version;
        abort_unless($version && $version->isReady(), 404);

        return response()->file(\Illuminate\Support\Facades\Storage::disk('local')->path($version->file_path), [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$assignment->form->code.'.pdf"',
        ]);
    }

    /**
     * Visa Information Form — the client generates the official VIF from their
     * completed assessment; it then becomes downloadable here and satisfies the
     * VIF checklist item. The client never uploads it (it's produced, not provided).
     */
    public function visaAssessment()
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) {
            return $lead;
        }

        return inertia('portal/lead/VisaAssessment', [
            'lead' => $this->leadPayload($lead),
            'vif' => $this->leadVif($lead),
        ]);
    }

    /** Resolve the lead's assessment intake (authoritative FK path). */
    private function leadIntake(Lead $lead)
    {
        if (! $lead->assessment_id) {
            return [null, null];
        }
        $assessment = \App\Models\Assessment::whereNotNull('intakeable_type')->find($lead->assessment_id);
        $intake = $assessment?->intakeable;
        $type = $intake ? match ($intake::class) {
            \App\Models\WorkIntake::class => 'work',
            \App\Models\StudentIntake::class => 'student',
            \App\Models\VisitorIntake::class => 'visitor',
            default => null,
        } : null;

        return [$type, $type ? $intake : null];
    }

    /** VIF availability + generated state for the client portal. */
    private function leadVif(Lead $lead): array
    {
        [$type, $intake] = $this->leadIntake($lead);
        $doc = \App\Models\LeadDocument::where('lead_id', $lead->id)->where('source_variant', 'vif')->latest()->first();

        return [
            'available' => $type !== null && $intake !== null, // has a work/student/visitor assessment
            'generated' => (bool) $doc,
            'generated_at' => optional($doc?->created_at)->toIso8601String(),
            'download_url' => $doc ? '/portal/lead/vif' : null,
        ];
    }

    /** Client generates their official VIF from the assessment. */
    public function generateVif()
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) {
            return $lead;
        }
        [$type, $intake] = $this->leadIntake($lead);
        abort_unless($intake, 422, 'No completed assessment to generate a Visa Information Form from.');

        $vif = \App\Support\VisaInformationForm::build($intake->toArray());
        $bytes = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.intake', [
            'applicant' => $vif['applicant'] ?: 'Applicant',
            'sections' => $vif['sections'],
            'intakeId' => $intake->intake_id ?? null,
            'generatedAt' => now()->format('d/m/Y'),
            'mode' => 'pdf',
        ])->setPaper('a4')->output();

        $name = trim(preg_replace('/[^A-Za-z0-9 \-]/', '', $vif['applicant'] ?? '')) ?: 'Applicant';
        $path = "lead-documents/{$lead->id}/vif-".\Illuminate\Support\Str::uuid().'.pdf';
        \Illuminate\Support\Facades\Storage::disk('local')->put($path, $bytes);

        // Replaces any prior VIF; checklist_key 'svf' satisfies the VIF checklist item.
        \App\Models\LeadDocument::updateOrCreate(
            ['lead_id' => $lead->id, 'source_variant' => 'vif'],
            [
                'checklist_key' => 'svf',
                'original_name' => "{$name} VIF.pdf",
                'file_path' => $path,
                'mime' => 'application/pdf',
                'size' => strlen($bytes),
                'source' => 'generated',
                'status' => 'Submitted',
            ],
        );

        return back()->with('success', 'Your Visa Information Form has been generated.');
    }

    /** Stream the client's generated VIF. */
    public function downloadVif()
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) {
            return $lead;
        }
        $doc = \App\Models\LeadDocument::where('lead_id', $lead->id)->where('source_variant', 'vif')->latest()->firstOrFail();
        abort_unless($doc->file_path && \Illuminate\Support\Facades\Storage::disk('local')->exists($doc->file_path), 404);

        return response()->file(\Illuminate\Support\Facades\Storage::disk('local')->path($doc->file_path), [
            'Content-Disposition' => 'inline; filename="'.$doc->original_name.'"',
        ]);
    }

    /** My Family — dependants the principal has included in their application. */
    public function family()
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) {
            return $lead;
        }

        $dependents = \App\Models\CaseDependent::where('lead_id', $lead->id)
            ->with(['documents' => fn ($q) => $q->orderByDesc('created_at')])
            ->orderBy('created_at')
            ->get()
            ->map(fn (\App\Models\CaseDependent $d) => array_merge([
                'id' => $d->id,
                'relationship' => $d->relationship,
                'first_name' => $d->first_name,
                'family_name' => $d->family_name,
                'middle_name' => $d->middle_name,
                'full_name' => $d->fullName(),
                'dob' => optional($d->dob)->toDateString(),
                'gender' => $d->gender,
                'nationality' => $d->nationality,
                'passport_number' => $d->passport_number,
                'passport_expiry' => optional($d->passport_expiry)->toDateString(),
            ], $d->checklistData()));

        return inertia('portal/lead/Family', ['lead' => $this->leadPayload($lead), 'dependents' => $dependents]);
    }

    private function familyRules(): array
    {
        return [
            'relationship' => ['required', \Illuminate\Validation\Rule::in(\App\Models\CaseDependent::RELATIONSHIPS)],
            'first_name' => 'nullable|string|max:120',
            'family_name' => 'nullable|string|max:120',
            'middle_name' => 'nullable|string|max:120',
            'dob' => 'nullable|date',
            'gender' => 'nullable|string|max:20',
            'nationality' => 'nullable|string|max:100',
            'passport_number' => 'nullable|string|max:60',
            'passport_expiry' => 'nullable|date',
        ];
    }

    /** Principal adds a dependant — auto-linked to their own case. */
    public function familyStore(\Illuminate\Http\Request $request)
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) {
            return $lead;
        }

        \App\Models\CaseDependent::create(array_merge($request->validate($this->familyRules()), [
            'lead_id' => $lead->id,
            'source' => 'portal',
        ]));

        return back()->with('success', 'Family member added.');
    }

    public function familyUpdate(\Illuminate\Http\Request $request, int $id)
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) {
            return $lead;
        }
        $dep = \App\Models\CaseDependent::where('id', $id)->where('lead_id', $lead->id)->firstOrFail();
        $dep->update($request->validate($this->familyRules()));

        return back()->with('success', 'Family member updated.');
    }

    public function familyDelete(int $id)
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) {
            return $lead;
        }
        $dep = \App\Models\CaseDependent::where('id', $id)->where('lead_id', $lead->id)->firstOrFail();
        foreach ($dep->documents as $doc) {
            if ($doc->file_path && \Illuminate\Support\Facades\Storage::disk('local')->exists($doc->file_path)) {
                \Illuminate\Support\Facades\Storage::disk('local')->delete($doc->file_path);
            }
        }
        $dep->documents()->delete();
        $dep->delete();

        return back()->with('success', 'Family member removed.');
    }

    public function familyDocumentStore(\Illuminate\Http\Request $request, int $id)
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) {
            return $lead;
        }
        $dep = \App\Models\CaseDependent::where('id', $id)->where('lead_id', $lead->id)->firstOrFail();
        $data = $request->validate([
            'file' => 'required|file|max:20480',
            'checklist_key' => ['nullable', 'string', \Illuminate\Validation\Rule::in(\App\Services\Immigration\DependentChecklist::keys($dep->relationship))],
        ]);

        $file = $request->file('file');
        $path = $file->store("lead-documents/{$lead->id}/dependents/{$dep->id}", 'local');

        \App\Models\LeadDocument::create([
            'lead_id' => $lead->id,
            'dependent_id' => $dep->id,
            'checklist_key' => $data['checklist_key'] ?? null,
            'original_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime' => $file->getClientMimeType(),
            'size' => $file->getSize(),
            'source' => 'dependent',
            'status' => 'Submitted',
        ]);

        return back()->with('success', 'Document uploaded.');
    }

    public function familyDocumentDelete(int $id, int $docId)
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) {
            return $lead;
        }
        $dep = \App\Models\CaseDependent::where('id', $id)->where('lead_id', $lead->id)->firstOrFail();
        $doc = \App\Models\LeadDocument::where('id', $docId)->where('dependent_id', $dep->id)->firstOrFail();
        if ($doc->file_path && \Illuminate\Support\Facades\Storage::disk('local')->exists($doc->file_path)) {
            \Illuminate\Support\Facades\Storage::disk('local')->delete($doc->file_path);
        }
        $doc->delete();

        return back()->with('success', 'Document removed.');
    }

    public function familyDocumentDownload(int $id, int $docId)
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) {
            return $lead;
        }
        $dep = \App\Models\CaseDependent::where('id', $id)->where('lead_id', $lead->id)->firstOrFail();
        $doc = \App\Models\LeadDocument::where('id', $docId)->where('dependent_id', $dep->id)->firstOrFail();
        abort_unless($doc->file_path && \Illuminate\Support\Facades\Storage::disk('local')->exists($doc->file_path), 404);

        return response()->file(\Illuminate\Support\Facades\Storage::disk('local')->path($doc->file_path), [
            'Content-Disposition' => 'inline; filename="'.$doc->original_name.'"',
        ]);
    }

    /** Appointments — upcoming + past, derived from Bookings on email match. */
    public function appointments()
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) return $lead;

        $bookings = Booking::where('email', $lead->email)->orderByDesc('appointment_date')->get();
        $now = now()->toDateString();

        return inertia('portal/lead/Appointments', [
            'lead'     => $this->leadPayload($lead),
            'upcoming' => $bookings->filter(fn ($b) => $b->appointment_date && $b->appointment_date->toDateString() >= $now)->values()->map(fn ($b) => $this->bookingRow($b)),
            'past'     => $bookings->filter(fn ($b) => ! $b->appointment_date || $b->appointment_date->toDateString() < $now)->values()->map(fn ($b) => $this->bookingRow($b)),
        ]);
    }

    public function proposals()
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) return $lead;
        return inertia('portal/lead/Proposals', ['lead' => $this->leadPayload($lead)]);
    }

    public function agreements()
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) return $lead;
        return inertia('portal/lead/Agreements', ['lead' => $this->leadPayload($lead)]);
    }

    public function payments()
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) return $lead;
        return inertia('portal/lead/Payments', ['lead' => $this->leadPayload($lead)]);
    }

    /**
     * Read-only history of emails the team has sent this lead. Scoped to the
     * caller's own record ($user->lead) — there is no id parameter, so a lead
     * can never reach another lead's messages. (Two-way replies land in
     * Build 14; SMS history is withheld here for now.)
     */
    public function messages()
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) return $lead;

        $messages = \App\Models\MessageLog::where('recipient_type', 'lead')
            ->where('recipient_id', $lead->id)
            ->where('channel', \App\Models\MessageLog::CHANNEL_EMAIL)
            ->with('triggeredBy:id,name')
            ->latest()
            ->paginate(20)
            ->through(fn (\App\Models\MessageLog $m) => [
                'id'         => $m->id,
                'subject'    => $m->subject,
                'body'       => $m->body,
                'from'       => $m->triggeredBy?->name ?? 'ePathways',
                'created_at' => $m->created_at?->toIso8601String(),
            ]);

        return inertia('portal/lead/Messages', [
            'lead'     => $this->leadPayload($lead),
            'messages' => $messages,
        ]);
    }

    public function settings()
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) return $lead;
        return inertia('portal/lead/Settings', ['lead' => $this->leadPayload($lead)]);
    }

    /**
     * The lead portal is three tracker views, one per sidebar item:
     *   dashboard()    → Overview      (/portal/lead/dashboard)
     *   requirements() → checklist     (/portal/lead/requirements)
     *   profile()      → applicant     (/portal/lead/profile)
     * All reuse LeadTrackingController's payload builder so the client, staff
     * and public /track/{code} surfaces can never drift. tracker() is kept as a
     * back-compat alias that lands on the dashboard view.
     */
    public function dashboard()
    {
        return $this->trackerView('overview');
    }

    public function requirements()
    {
        return $this->trackerView('visa');
    }

    public function profile()
    {
        return $this->trackerView('profile');
    }

    public function tracker()
    {
        return $this->trackerView('overview');
    }

    private function trackerView(string $tab)
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) {
            return $lead;
        }

        $payload = app(LeadTrackingController::class)->buildTrackerPayload($lead, $lead->tracking_code);
        $payload['embedded'] = true;
        $payload['sidebarTabs'] = true;
        $payload['initialTab'] = $tab;

        return inertia('portal/lead/Tracker', $payload);
    }

    /**
     * Let a signed-in lead change their own portal password. Verifies the
     * current password (via the `current_password` rule against the active
     * guard) before applying the new one.
     */
    public function updatePassword(\Illuminate\Http\Request $request)
    {
        $lead = $this->resolveLeadOrLogout();
        if (! $lead instanceof Lead) return $lead;

        $data = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', \Illuminate\Validation\Rules\Password::min(8)],
        ], [
            'current_password.current_password' => 'Your current password is incorrect.',
        ]);

        $request->user()->update([
            'password' => \Illuminate\Support\Facades\Hash::make($data['password']),
        ]);

        return back()->with('success', 'Your password has been updated.');
    }

    private function bookingRow(Booking $b): array
    {
        return [
            'id'               => $b->id,
            'service_type'     => $b->service_type,
            'consultant_name'  => $b->consultant_name,
            'platform'         => $b->platform,
            'status'           => $b->status ?: 'Pending',
            'appointment_date' => $b->appointment_date ? \Illuminate\Support\Carbon::parse($b->appointment_date)->toDateString() : null,
            'appointment_time' => $b->appointment_time,
            'message'          => $b->message,
            'created_at'       => $b->created_at,
        ];
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
