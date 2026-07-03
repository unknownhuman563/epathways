<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\Booking;
use App\Models\Event;
use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\ResidentIntake;
use App\Models\UserReview;
use App\Traits\BuildsLeadRow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class ImmigrationController extends Controller
{
    use BuildsLeadRow;

    private const LEAD_STATUSES = Lead::STAGES;

    /**
     * Immigration dashboard — adviser-focused. Top tiles show "what's on my
     * plate today", visa-case pipeline + INZ aging surface the active work,
     * and the public-submissions strip preserves the historical view.
     */
    public function dashboard()
    {
        try {
            $now = now();
            $weekStart = $now->copy()->startOfWeek();
            $monthStart = $now->copy()->startOfMonth();

            // ── Top tiles ──────────────────────────────────────────────────
            // A lead is an immigration case if the team explicitly opened
            // one (is_immigration_case) OR the Education team's hand-off
            // stage was set to one of the immigration stages — see
            // Lead::scopeImmigrationCase().
            $activeCases = Lead::immigrationCase()->count();
            $newAssessmentsThisWeek = ResidentIntake::where('created_at', '>=', $weekStart)->count();
            $bookingsPaidUnseen = Booking::where('status', 'Confirmed')->whereNull('appointment_date')->count();
            $docsPendingReview = LeadDocument::whereIn('status', ['Submitted', 'UnderReview'])->count();
            $casesLodged = Lead::immigrationCase()->whereIn('inz_status', ['Lodged', 'Decision Pending', 'Info Requested'])->count();
            $infoRequests = Lead::immigrationCase()->where('inz_status', 'Info Requested')->count();

            // ── INZ pipeline aging (green / amber / red) ─────────────────
            $visaTypes = \App\Models\VisaType::pluck('expected_processing_days', 'name')->all();
            $defaultWindow = 40; // fallback when visa-type not in catalog
            $inzCases = Lead::immigrationCase()
                ->whereIn('inz_status', ['Lodged', 'Decision Pending', 'Info Requested'])
                ->whereNotNull('inz_lodged_at')
                ->get(['id', 'lead_id', 'first_name', 'last_name', 'inz_visa_type', 'inz_lodged_at', 'inz_status']);

            $inzAging = ['green' => 0, 'amber' => 0, 'red' => 0, 'rows' => []];
            foreach ($inzCases as $c) {
                $window = $visaTypes[$c->inz_visa_type] ?? $defaultWindow;
                $daysSince = (int) \Illuminate\Support\Carbon::parse($c->inz_lodged_at)->diffInDays(now());
                $bucket = $daysSince > $window ? 'red'
                    : ($daysSince >= ($window - 5) ? 'amber' : 'green');
                $inzAging[$bucket]++;
                $inzAging['rows'][] = [
                    'id' => $c->id,
                    'lead_id' => $c->lead_id,
                    'name' => trim("{$c->first_name} {$c->last_name}") ?: 'Unknown',
                    'visa_type' => $c->inz_visa_type,
                    'lodged_at' => $c->inz_lodged_at,
                    'days_since' => $daysSince,
                    'expected_days' => $window,
                    'bucket' => $bucket,
                    'status' => $c->inz_status,
                ];
            }
            // Sort rows by aging (worst first).
            usort($inzAging['rows'], fn ($a, $b) => $b['days_since'] <=> $a['days_since']);

            // ── IAA compliance — current user's licence status ──────────
            $me = auth()->user();
            $iaa = null;
            if ($me) {
                $expiry = $me->iaa_licence_expiry;
                $iaa = [
                    'licence_number' => $me->iaa_licence_number,
                    'expiry' => $expiry ? $expiry->toDateString() : null,
                    'days_to_expiry' => $expiry ? (int) now()->diffInDays($expiry, false) : null,
                    'status' => ! $me->iaa_licence_number ? 'missing'
                        : (! $expiry ? 'no_expiry'
                            : ((int) now()->diffInDays($expiry, false) < 0 ? 'expired'
                                : ((int) now()->diffInDays($expiry, false) <= 60 ? 'expiring' : 'ok'))),
                ];
            }

            // ── 6-month intakes trend (kept from old dashboard) ────────────
            $monthly = [];
            for ($i = 5; $i >= 0; $i--) {
                $mStart = $now->copy()->subMonths($i)->startOfMonth();
                $mEnd = $now->copy()->subMonths($i)->endOfMonth();
                $monthly[] = [
                    'label' => $mStart->format('M'),
                    'intakes' => ResidentIntake::whereBetween('created_at', [$mStart, $mEnd])->count(),
                ];
            }

            // ── Visa-case pipeline — leads in any "visa-touching" stage ────
            // We don't have separate INZ statuses yet; the closest proxy is
            // the lead's pipeline status. Frontend flags as needing infra.
            $visaStages = ['Visa Process', 'Consultancy Agreement', 'English Pro', 'School Enrollment'];
            $pipeline = collect($visaStages)->map(fn ($s) => [
                'stage' => $s,
                'count' => Lead::where('status', $s)->count(),
            ])->all();

            // ── Urgent actions feed ────────────────────────────────────────
            $urgent = [
                'assessments_pending' => ResidentIntake::whereIn('status', ['New', null])->count(),
                'paid_unscheduled' => $bookingsPaidUnseen,
                'rejected_docs' => LeadDocument::where('status', 'Rejected')->where('reviewed_at', '>', $now->copy()->subDays(14))->count(),
                'agreements_pending' => Lead::where('status', 'Consultancy Agreement')->count(),
            ];

            // ── This week's appointments ───────────────────────────────────
            $weekEnd = $now->copy()->endOfWeek();
            $weekAppts = Booking::whereBetween('appointment_date', [$weekStart, $weekEnd])
                ->orderBy('appointment_date')->orderBy('appointment_time')
                ->limit(8)->get()
                ->map(fn ($b) => [
                    'id' => $b->id,
                    'name' => trim("{$b->first_name} {$b->last_name}") ?: 'Unknown',
                    'service_type' => $b->service_type,
                    'consultant_name' => $b->consultant_name,
                    'platform' => $b->platform,
                    'status' => $b->status ?: 'Pending',
                    'appointment_date' => $b->appointment_date ? \Illuminate\Support\Carbon::parse($b->appointment_date)->toDateString() : null,
                    'appointment_time' => $b->appointment_time,
                ]);

            return inertia('portal/immigration/Dashboard', [
                'tiles' => [
                    'active_cases' => $activeCases,
                    'new_assessments_week' => $newAssessmentsThisWeek,
                    'bookings_paid_unseen' => $bookingsPaidUnseen,
                    'docs_pending_review' => $docsPendingReview,
                    'cases_lodged' => $casesLodged,
                    'info_requests_outstanding' => $infoRequests,
                ],
                'pipeline' => $pipeline,
                'inz_aging' => $inzAging,
                'iaa' => $iaa,
                'monthly' => $monthly,
                'urgent' => $urgent,
                'week_appointments' => $weekAppts,
                'recent_intakes' => ResidentIntake::latest()->take(5)->get([
                    'id', 'intake_id', 'first_name', 'last_name', 'email',
                    'current_visa_type', 'status', 'created_at',
                ]),
                'recent_reviews' => UserReview::latest()->take(5)->get([
                    'id', 'review_id', 'name', 'email', 'mode', 'status', 'created_at',
                ]),
            ]);
        } catch (\Throwable $e) {
            Log::error('Immigration dashboard failed', ['error' => $e->getMessage()]);

            return inertia('portal/immigration/Dashboard', [
                'tiles' => [], 'pipeline' => [], 'monthly' => [], 'urgent' => [],
                'week_appointments' => [], 'recent_intakes' => [], 'recent_reviews' => [],
            ]);
        }
    }

    /**
     * Leads queue — Immigration's pre-engagement-fee leads. Same shape as
     * Sales / Education so the shared Leads.jsx renders identically.
     */
    public function leads()
    {
        try {
            return inertia('portal/immigration/Leads', [
                'portal' => 'immigration',
                'statuses' => self::LEAD_STATUSES,
                // Pipeline only — converted leads (cases) move to the Cases page.
                'leads' => Lead::inLeadPipeline()
                    ->with(['studyPlans', 'event', 'portalUser:id,lead_id,last_login_at'])
                    ->latest()->get()->map(fn ($l) => $this->leadRow($l)),
                'events' => $this->eventsSummary(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Immigration leads list failed', ['error' => $e->getMessage()]);

            return inertia('portal/immigration/Leads', [
                'portal' => 'immigration', 'statuses' => self::LEAD_STATUSES, 'leads' => collect(),
            ]);
        }
    }

    public function updateLead(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(self::LEAD_STATUSES)],
        ]);
        try {
            $lead = Lead::findOrFail($id);
            $lead->status = $validated['status'];
            $lead->save();

            return back()->with('success', "Lead {$lead->lead_id} updated.");
        } catch (\Throwable $e) {
            Log::error('Immigration lead update failed', ['id' => $id, 'error' => $e->getMessage()]);

            return back()->with('error', 'Could not update that lead. Please try again.');
        }
    }

    /** Events list for the Leads page "Events" tab — each with a registrant count. */
    private function eventsSummary()
    {
        return Event::withCount('leads')
            ->orderByDesc('date_from')
            ->latest()
            ->get()
            ->map(fn (Event $e) => [
                'id' => $e->id,
                'name' => $e->name,
                'event_code' => $e->event_code,
                'type' => $e->type,
                'mode' => $e->mode,
                'location' => $e->location,
                'date_from' => optional($e->date_from)->toIso8601String(),
                'status' => $e->status,
                'registrations_count' => $e->leads_count,
            ]);
    }

    /** GET /portal/immigration/events/{id}/registrations — registrants drawer. */
    public function eventRegistrations($id)
    {
        $event = Event::findOrFail($id);

        $registrations = $event->leads()
            ->latest()
            ->get()
            ->map(fn (Lead $l) => [
                'id' => $l->id,
                'lead_id' => $l->lead_id,
                'name' => trim("{$l->first_name} {$l->last_name}") ?: 'Unnamed lead',
                'email' => $l->email,
                'phone' => $l->phone,
                'status' => $l->status,
                'created_at' => optional($l->created_at)->toIso8601String(),
            ]);

        return response()->json([
            'event' => ['id' => $event->id, 'name' => $event->name],
            'registrations' => $registrations,
        ]);
    }

    /**
     * Cases — leads that have engaged Immigration (currently proxied via
     * Visa Process stage; a dedicated is_immigration_case flag is the next
     * piece of infra to add, mirroring is_student).
     */
    public function cases()
    {
        try {
            $cases = Lead::with([
                'documents',
                'portalUser:id,lead_id,last_login_at',
                'immigrationConverter:id,name',
                'studentConverter:id,name',
                'stageUpdater:id,name',
            ])
                ->immigrationCase()
                ->orderByDesc('updated_at')
                ->limit(200)
                ->get()
                ->map(fn ($l) => [
                    'id' => $l->id,
                    'lead_id' => $l->lead_id,
                    // Customer-shareable tracking code — drives the
                    // "Copy tracking link" row action so staff can paste a
                    // /track/{code} URL straight to the client.
                    'tracking_code' => $l->tracking_code,
                    // Most recent stage-mover (falls back to the original
                    // converter if the row predates stage-update
                    // tracking). Drives "Updated [date] · Endorsed by
                    // [Name]" under the stage chip.
                    'endorsed_by' => optional($l->stageUpdater)->name
                                            ?? optional($l->immigrationConverter)->name
                                            ?? optional($l->studentConverter)->name,
                    'stage_updated_at' => optional($l->stage_updated_at)?->toIso8601String(),
                    'name' => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
                    // Individual name parts + a few more fields so the row
                    // "Edit case" modal can pre-fill without another fetch.
                    'first_name' => $l->first_name,
                    'middle_name' => $l->middle_name,
                    'last_name' => $l->last_name,
                    'suffix' => $l->suffix,
                    'gender' => $l->gender,
                    'payment' => $l->student_payment,
                    'email' => $l->email,
                    'phone' => $l->phone,
                    'country' => $l->residence_country,
                    'status' => $l->status,
                    'inz_status' => $l->inz_status,
                    'inz_visa_type' => $l->inz_visa_type,
                    'inz_reference' => $l->inz_reference,
                    'inz_lodged_at' => $l->inz_lodged_at,
                    // Immigration-team sub-stage. Drives both the inline
                    // status picker on each row and the distribution graph
                    // up top. Pre-existing leads still on `inz_status`
                    // fall back to "Unassigned".
                    'immigration_stage' => $l->immigration_stage,
                    'immigration_priority' => $l->immigration_priority,
                    'docs_total' => $l->documents->count(),
                    'docs_approved' => $l->documents->where('status', 'Approved')->count(),
                    'docs_pending' => $l->documents->whereIn('status', ['Submitted', 'UnderReview'])->count(),
                    'docs_rejected' => $l->documents->where('status', 'Rejected')->count(),
                    'updated_at' => $l->updated_at,
                ]);

            // Distribution payload for the stacked-bar graph that replaces
            // the old summary cards. Counts how many cases sit in each
            // canonical immigration_stage value plus an "Unassigned"
            // bucket for cases that haven't been put on the ladder yet.
            $distribution = collect(Lead::IMMIGRATION_STAGES)
                ->map(fn ($stage) => [
                    'stage' => $stage,
                    'count' => $cases->where('immigration_stage', $stage)->count(),
                ])
                ->push([
                    'stage' => 'Unassigned',
                    'count' => $cases->whereNull('immigration_stage')->count(),
                ])
                ->values();

            // Priority breakdown for the small counter next to the stage
            // graph — urgent / medium / low + a "none" bucket for cases with
            // no priority set.
            $priorities = [
                'urgent' => $cases->where('immigration_priority', 'urgent')->count(),
                'medium' => $cases->where('immigration_priority', 'medium')->count(),
                'low' => $cases->where('immigration_priority', 'low')->count(),
            ];
            $priorities['none'] = max(0, $cases->count() - array_sum($priorities));

            // Visa-type catalogue for the "Add new case" form. Active
            // entries only so inactive types don't pollute the dropdown,
            // ordered by category → name to match VisaType admin tooling.
            $visaTypes = \App\Models\VisaType::query()
                ->where('active', true)
                ->orderBy('category')
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'category']);

            return inertia('portal/immigration/Cases', [
                'cases' => $cases,
                'distribution' => $distribution,
                'priorities' => $priorities,
                'stages' => Lead::IMMIGRATION_STAGES,
                'visaTypes' => $visaTypes,
            ]);
        } catch (\Throwable $e) {
            Log::error('Immigration cases list failed', ['error' => $e->getMessage()]);

            return inertia('portal/immigration/Cases', [
                'cases' => [],
                'distribution' => [],
                'priorities' => ['urgent' => 0, 'medium' => 0, 'low' => 0, 'none' => 0],
                'stages' => Lead::IMMIGRATION_STAGES,
                'visaTypes' => [],
            ]);
        }
    }

    /**
     * Create a brand-new immigration case from the Cases page. Saves a
     * Lead row flagged as an immigration case, optionally attaches a
     * LeadNote for the internal-note field, and stamps `inz_visa_type`
     * from the chosen visa-type name so existing tooling sees a familiar
     * label.
     */
    public function storeCase(\Illuminate\Http\Request $request)
    {
        $data = $request->validate([
            'first_name' => 'required|string|max:80',
            'middle_name' => 'nullable|string|max:80',
            'last_name' => 'required|string|max:80',
            'suffix' => 'nullable|string|max:20',
            'gender' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:120',
            'phone' => 'nullable|string|max:40',
            // Stage is now optional — if the staff member doesn't pick
            // one we default to the first canonical value ("Endorsed")
            // below so the new case lands cleanly on the journey rail.
            'immigration_stage' => ['nullable', \Illuminate\Validation\Rule::in(Lead::IMMIGRATION_STAGES)],
            'immigration_priority' => ['nullable', \Illuminate\Validation\Rule::in(Lead::IMMIGRATION_PRIORITIES)],
            'internal_note' => 'nullable|string|max:5000',
            'payment' => 'nullable|string|max:120',
            'visa_type_id' => 'nullable|integer|exists:visa_types,id',
        ]);

        $visa = \App\Models\VisaType::find($data['visa_type_id']);

        $lead = Lead::create([
            'lead_id' => 'IC-'.strtoupper(uniqid()),
            'first_name' => $data['first_name'],
            'middle_name' => $data['middle_name'] ?? null,
            'last_name' => $data['last_name'],
            'suffix' => $data['suffix'] ?? null,
            'gender' => $data['gender'] ?? null,
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'immigration_stage' => $data['immigration_stage'] ?? Lead::IMMIGRATION_STAGES[0],
            'immigration_priority' => $data['immigration_priority'] ?? null,
            'inz_visa_type' => $visa?->name,
            'student_payment' => $data['payment'] ?? null,
            // Mark immediately as an immigration case so scopeImmigrationCase
            // picks it up without waiting for a stage hand-off.
            'is_immigration_case' => true,
            'immigration_converted_at' => now(),
            'immigration_converted_by' => auth()->id(),
            // Initial stage stamp — drives "Updated [date] · Endorsed by
            // [Name]" subtitle in the Cases table.
            'stage_updated_at' => now(),
            'stage_updated_by' => auth()->id(),
            'source' => 'manual.immigration',
            'status' => 'New',
            'stage' => 'Visa Process',
        ]);

        // Internal note → LeadNote so it surfaces in the same notes feed
        // the rest of the system writes to, rather than getting buried in
        // a free-form column.
        if (! empty($data['internal_note'])) {
            \App\Models\LeadNote::create([
                'lead_id' => $lead->id,
                'kind' => 'general',
                'body' => $data['internal_note'],
                'author_name' => auth()->user()?->name ?? 'System',
                'author_role' => auth()->user()?->role ?? 'immigration',
            ]);
        }

        return back()->with('success', "Case {$lead->lead_id} created.");
    }

    /** POST /portal/immigration/cases/{id} — edit a case's core details
     *  (same fields as the "New case" modal). */
    public function updateCase(\Illuminate\Http\Request $request, $id)
    {
        $lead = Lead::immigrationCase()->findOrFail($id);

        $data = $request->validate([
            'first_name' => 'required|string|max:80',
            'middle_name' => 'nullable|string|max:80',
            'last_name' => 'required|string|max:80',
            'suffix' => 'nullable|string|max:20',
            'gender' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:120',
            'phone' => 'nullable|string|max:40',
            'immigration_stage' => ['nullable', \Illuminate\Validation\Rule::in(Lead::IMMIGRATION_STAGES)],
            'immigration_priority' => ['nullable', \Illuminate\Validation\Rule::in(Lead::IMMIGRATION_PRIORITIES)],
            'internal_note' => 'nullable|string|max:5000',
            'payment' => 'nullable|string|max:120',
            'visa_type_id' => 'nullable|integer|exists:visa_types,id',
        ]);

        $visa = \App\Models\VisaType::find($data['visa_type_id']);

        $lead->update([
            'first_name' => $data['first_name'],
            'middle_name' => $data['middle_name'] ?? null,
            'last_name' => $data['last_name'],
            'suffix' => $data['suffix'] ?? null,
            'gender' => $data['gender'] ?? null,
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'immigration_stage' => $data['immigration_stage'] ?? $lead->immigration_stage,
            'immigration_priority' => $data['immigration_priority'] ?? null,
            'inz_visa_type' => $visa?->name,
            'student_payment' => $data['payment'] ?? null,
        ]);

        // A note is optional on edit — only append when the staffer typed one.
        if (! empty($data['internal_note'])) {
            \App\Models\LeadNote::create([
                'lead_id' => $lead->id,
                'kind' => 'general',
                'body' => $data['internal_note'],
                'author_name' => auth()->user()?->name ?? 'System',
                'author_role' => auth()->user()?->role ?? 'immigration',
            ]);
        }

        return back()->with('success', "Case {$lead->lead_id} updated.");
    }

    /**
     * Inline stage update from the Cases table. Mirrors EducationController's
     * `updateStudentField` pattern — single endpoint, immigration_stage is
     * the only field accepted.
     */
    public function updateCaseStage(\Illuminate\Http\Request $request, $id)
    {
        $lead = Lead::immigrationCase()->findOrFail($id);

        $data = $request->validate([
            'immigration_stage' => ['nullable', \Illuminate\Validation\Rule::in(Lead::IMMIGRATION_STAGES)],
            'immigration_assignee' => ['nullable', \Illuminate\Validation\Rule::in(Lead::IMMIGRATION_STAGE_ASSIGNEES)],
        ]);

        $newStage = $data['immigration_stage'] ?? null;
        $stageMoved = ($lead->immigration_stage ?? null) !== $newStage;

        if (array_key_exists('immigration_assignee', $data)) {
            $lead->immigration_assignee = $data['immigration_assignee'] ?: null;
        }

        if ($stageMoved) {
            $lead->immigration_stage = $newStage;
            // Only stamp the stage-tracking columns when the stage
            // actually moved — re-saving the same value shouldn't refresh
            // the "Updated [date]" subtitle the table shows.
            $lead->stage_updated_at = now();
            $lead->stage_updated_by = auth()->id();
            $lead->pushStageHistory('immigration', $newStage, $lead->immigration_assignee);
        }

        if ($stageMoved || $lead->isDirty('immigration_assignee')) {
            $lead->save();
        }

        return back();
    }

    /**
     * Inline visa-type update from the Cases table. Stamps the matching
     * VisaType name onto `inz_visa_type` (or clears it when null is posted).
     */
    public function updateCaseVisa(\Illuminate\Http\Request $request, $id)
    {
        $lead = Lead::immigrationCase()->findOrFail($id);

        $data = $request->validate([
            'visa_type_id' => 'nullable|integer|exists:visa_types,id',
        ]);

        $visa = ! empty($data['visa_type_id'])
            ? \App\Models\VisaType::find($data['visa_type_id'])
            : null;

        $lead->inz_visa_type = $visa?->name;
        $lead->save();

        return back();
    }

    /**
     * Convert a public visa-interest submission into an active immigration
     * case — works for all four intake types (Resident / Work / Student /
     * Visitor) via the Assessment's polymorphic intakeable relationship.
     *
     * Route param accepts either an Assessment ID (preferred, current
     * frontend) or a legacy ResidentIntake ID (kept working so any
     * pre-Phase-B bookmarks still convert correctly). The shim resolves
     * the right Assessment regardless of which ID was posted.
     *
     * Idempotent: if the matched Lead is already flagged as an immigration
     * case, the existing immigration_converted_at timestamp is preserved.
     * The Assessment + intake are still progressed so the row leaves the
     * triage queue.
     */
    public function convertAssessmentToCase($id)
    {
        try {
            // Prefer Assessment ID (post-Phase-B route + frontend). If
            // that fails, treat the id as a legacy ResidentIntake ID and
            // resolve its paired Assessment for backward compat with the
            // old `/assessments/{intakeId}/convert-to-case` URL.
            $assessment = Assessment::with(['visaType', 'intakeable'])->find($id);
            if (! $assessment) {
                $residentIntake = ResidentIntake::find($id);
                if ($residentIntake) {
                    $assessment = Assessment::with(['visaType', 'intakeable'])
                        ->where('intakeable_type', ResidentIntake::class)
                        ->where('intakeable_id', $residentIntake->id)
                        ->first();
                }
                // Legacy path — the resident intake exists but no
                // Assessment was ever created (pre-Phase-A submission +
                // backfill not yet run). Fall back to the original
                // intake-only flow so the convert button isn't a dead end.
                if (! $assessment && $residentIntake) {
                    return $this->convertResidentIntakeWithoutAssessment($residentIntake);
                }
            }

            if (! $assessment) {
                Log::warning('Convert-to-case: no Assessment or ResidentIntake matched.', ['id' => $id]);

                return back()->with('error', 'Could not find this submission.');
            }

            $intake = $assessment->intakeable;
            if (! $intake) {
                Log::error('Convert-to-case: Assessment has no intakeable.', ['assessment_id' => $assessment->id]);

                return back()->with('error', 'Submission data is incomplete; please contact support.');
            }

            // Visa name from the linked VisaType — falls back to the
            // intake's own visa label so we never blank-stamp inz_visa_type.
            $visaName = $assessment->visaType?->name
                ?? \App\Support\IntakeVisaTypeMap::label($intake::class);

            // Last-name snapshot tolerates both naming conventions
            // (Resident uses last_name; Work/Student/Visitor use family_name).
            $lastName = $intake->last_name ?? $intake->family_name ?? null;

            return DB::transaction(function () use ($assessment, $intake, $visaName, $lastName) {
                // Find-or-create the Lead by email. firstOrNew lets us
                // populate snapshot fields only on a fresh row.
                $email = $intake->email ?: $assessment->applicant_email;
                $lead = $email ? Lead::where('email', $email)->first() : null;

                if (! $lead) {
                    $lead = Lead::create([
                        'lead_id' => 'LP-'.str_pad((string) (Lead::max('id') + 1000), 5, '0', STR_PAD_LEFT),
                        'first_name' => $intake->first_name ?? $assessment->applicant_first_name,
                        'last_name' => $lastName ?? $assessment->applicant_last_name,
                        'email' => $email,
                        'phone' => $intake->phone ?? $assessment->applicant_phone,
                        'dob' => $intake->dob ?? null,
                        'citizenship' => $intake->country_of_citizenship ?? $intake->nationality ?? null,
                        'country_of_birth' => $intake->country_of_birth ?? null,
                        'place_of_birth' => $intake->place_of_birth ?? null,
                        'passport_number' => $intake->passport_number ?? null,
                        'passport_expiry' => $intake->passport_expiry ?? null,
                        'source' => self::sourceForIntake($intake),
                        'status' => 'New Leads',
                    ]);
                }

                // Idempotent flip — preserve the original conversion
                // timestamp on a re-run. We still stamp inz_visa_type so
                // a Work-then-Resident conversion can update the visa
                // label without changing the conversion date.
                $patch = ['inz_visa_type' => $visaName];
                if (! $lead->is_immigration_case) {
                    $patch['is_immigration_case'] = true;
                    $patch['immigration_converted_at'] = now();
                    $patch['immigration_converted_by'] = auth()->id();
                    $patch['stage_updated_at'] = now();
                    $patch['stage_updated_by'] = auth()->id();
                }
                $lead->fill($patch)->save();

                // Mark the intake "Engaged" so it drops out of the
                // triage queue. Assessment moves to "completed" so the
                // assessment lifecycle reflects the handoff.
                $intake->update(['status' => 'Engaged']);
                $assessment->update(['status' => 'completed']);

                return redirect("/portal/immigration/leads/{$lead->id}?tab=documents")
                    ->with('success', "Converted {$lead->first_name} to an immigration case.");
            });
        } catch (\Throwable $e) {
            Log::error('Assessment to case conversion failed', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'Could not convert this assessment.');
        }
    }

    /**
     * Legacy fallback — a ResidentIntake exists but never had an
     * Assessment paired (submission predates Phase A and backfill hasn't
     * run yet). Preserves the original behaviour from before this build.
     */
    private function convertResidentIntakeWithoutAssessment(ResidentIntake $intake)
    {
        return DB::transaction(function () use ($intake) {
            $lead = Lead::where('email', $intake->email)->first();
            if (! $lead) {
                $lead = Lead::create([
                    'lead_id' => 'LP-'.str_pad((string) (Lead::max('id') + 1000), 5, '0', STR_PAD_LEFT),
                    'first_name' => $intake->first_name,
                    'last_name' => $intake->last_name,
                    'email' => $intake->email,
                    'phone' => $intake->phone,
                    'source' => 'resident-intake',
                    'status' => 'New Leads',
                ]);
            }

            if (! $lead->is_immigration_case) {
                $lead->fill([
                    'is_immigration_case' => true,
                    'immigration_converted_at' => now(),
                    'immigration_converted_by' => auth()->id(),
                    'stage_updated_at' => now(),
                    'stage_updated_by' => auth()->id(),
                ])->save();
            }
            $intake->update(['status' => 'Engaged']);

            return redirect("/portal/immigration/leads/{$lead->id}?tab=documents")
                ->with('success', "Converted {$intake->first_name} to an immigration case.");
        });
    }

    /** "resident-intake" / "work-intake" / "student-intake" / "visitor-intake". */
    private static function sourceForIntake($intake): string
    {
        return match ($intake::class) {
            \App\Models\ResidentIntake::class => 'resident-intake',
            \App\Models\WorkIntake::class => 'work-intake',
            \App\Models\StudentIntake::class => 'student-intake',
            \App\Models\VisitorIntake::class => 'visitor-intake',
            default => 'visa-intake',
        };
    }

    /** Assessments — public ResidentIntake submissions feed for adviser triage. */
    public function assessments()
    {
        try {
            // Pre-fetch all Assessments + their Bookings for the intakes we're
            // about to show. Indexed by intakeable id so the normalizer can
            // look up the journey state without N+1 queries.
            $loadAssessments = function (string $modelClass, $intakes) {
                if ($intakes->isEmpty()) {
                    return collect();
                }

                return \App\Models\Assessment::with('booking:id,status,appointment_date,appointment_time')
                    ->where('intakeable_type', $modelClass)
                    ->whereIn('intakeable_id', $intakes->pluck('id'))
                    ->get()
                    ->keyBy('intakeable_id');
            };

            // Pre-compute the set of applicant emails that already map to
            // a Lead flagged as an immigration case. The Convert button
            // is hidden when an email matches so we don't surface a
            // duplicate-conversion path; the row still renders with the
            // "Converted to Case" step lit up.
            $caseEmails = Lead::query()
                ->where('is_immigration_case', true)
                ->whereNotNull('email')
                ->pluck('email')
                ->map(fn ($e) => strtolower(trim($e)))
                ->flip(); // O(1) lookup via array key

            $normalize = function ($intake, string $visaType, $assessment) use ($caseEmails): array {
                $first = (string) ($intake->first_name ?? '');
                $last = (string) ($intake->last_name ?? $intake->family_name ?? '');
                $email = strtolower(trim((string) ($intake->email ?? '')));
                $hasAssessment = (bool) $assessment;

                // Triaged — staff have changed the intake status away from
                // the default "Submitted"/"submitted"/"New" set. Anything
                // else counts.
                $defaultStatuses = ['Submitted', 'submitted', 'New', 'new'];
                $isTriaged = $intake->status !== null
                    && ! in_array($intake->status, $defaultStatuses, true);

                // Converted — either matched a Lead already flagged as
                // an immigration case, or the row's intake status has
                // been set to "Engaged" (the post-convert state).
                $isConverted = ($email !== '' && isset($caseEmails[$email]))
                    || $intake->status === 'Engaged';

                return [
                    'id' => $intake->id,
                    'assessment_id' => $assessment?->id,
                    'intake_id' => $intake->intake_id,
                    'visa_type' => $visaType, // resident | work | student | visitor
                    'name' => trim("{$first} {$last}") ?: 'Unknown',
                    'email' => $intake->email,
                    'phone' => $intake->phone,
                    'status' => $intake->status,
                    'created_at' => $intake->created_at,
                    'extra' => $visaType === 'resident'
                        ? trim(($intake->current_visa_type ?? '').($intake->job_title ? ' · '.$intake->job_title : ''))
                        : null,
                    // Convert is available to all four visa types now,
                    // gated on (1) a paired Assessment exists, (2) the
                    // intake isn't already Engaged, (3) no existing
                    // Lead with matching email is already an
                    // immigration case.
                    // Resident intakes can convert even without a paired
                    // Assessment — the controller falls back to the
                    // intake-only path (convertResidentIntakeWithoutAssessment)
                    // so the action isn't a dead end for pre-Assessment rows.
                    'can_convert' => ($hasAssessment || $visaType === 'resident')
                        && $intake->status !== 'Engaged'
                        && ! $isConverted,
                    'detail_url' => $visaType === 'resident'
                        ? "/admin/immigration/resident-intakes/{$intake->id}"
                        : "/portal/immigration/intakes/{$visaType}/{$intake->id}",
                    // Three-step lifecycle: Submitted → Triaged →
                    // Converted to Case. Pay/Book are deliberately
                    // omitted while payment intake stays disabled —
                    // re-add when AssessmentController::simulatePay
                    // gets a real Stripe body.
                    'journey' => [
                        'submitted' => true, // any visible row exists
                        'submitted_at' => $intake->created_at,
                        'triaged' => $isTriaged,
                        'converted' => $isConverted,
                        'assessment_status' => $assessment?->status,
                    ],
                ];
            };

            // Pull each intake table, then their assessments in a single
            // query each.
            $resident = ResidentIntake::latest()->limit(200)->get();
            $work = \App\Models\WorkIntake::latest()->limit(200)->get();
            $student = \App\Models\StudentIntake::latest()->limit(200)->get();
            $visitor = \App\Models\VisitorIntake::latest()->limit(200)->get();

            $aResident = $loadAssessments(ResidentIntake::class, $resident);
            $aWork = $loadAssessments(\App\Models\WorkIntake::class, $work);
            $aStudent = $loadAssessments(\App\Models\StudentIntake::class, $student);
            $aVisitor = $loadAssessments(\App\Models\VisitorIntake::class, $visitor);

            $rows = collect()
                ->concat($resident->map(fn ($r) => $normalize($r, 'resident', $aResident->get($r->id))))
                ->concat($work->map(fn ($r) => $normalize($r, 'work', $aWork->get($r->id))))
                ->concat($student->map(fn ($r) => $normalize($r, 'student', $aStudent->get($r->id))))
                ->concat($visitor->map(fn ($r) => $normalize($r, 'visitor', $aVisitor->get($r->id))));

            $intakes = $rows->sortByDesc('created_at')->values();

            return inertia('portal/immigration/Assessments', ['intakes' => $intakes]);
        } catch (\Throwable $e) {
            Log::error('Immigration assessments page failed', ['error' => $e->getMessage()]);

            return inertia('portal/immigration/Assessments', ['intakes' => []]);
        }
    }

    /**
     * Generic intake viewer for the Work / Student / Visitor visa types.
     * Resident intakes already have their own dedicated detail page
     * (ResidentIntakeController@adminShow) — this method handles the
     * other three so the Assessments page rows are clickable across
     * every visa type. The frontend reads the intake row + its paired
     * Assessment + Booking and renders a clean property-row layout.
     */
    public function showIntake(string $type, int $id)
    {
        $modelMap = [
            'work' => \App\Models\WorkIntake::class,
            'student' => \App\Models\StudentIntake::class,
            'visitor' => \App\Models\VisitorIntake::class,
        ];
        if (! isset($modelMap[$type])) {
            abort(404, 'Unknown intake type.');
        }

        $class = $modelMap[$type];
        $intake = $class::findOrFail($id);

        // Paired Assessment (Pay/Book funnel state) + Booking if any.
        $assessment = \App\Models\Assessment::with('booking')
            ->where('intakeable_type', $class)
            ->where('intakeable_id', $intake->id)
            ->first();

        // If the applicant's email matches a Lead already converted to
        // an immigration case, link to it so the adviser can jump
        // straight to the working file instead of re-converting.
        $email = strtolower(trim((string) ($intake->email ?? '')));
        $lead = null;
        if ($email !== '') {
            $lead = Lead::where('is_immigration_case', true)
                ->whereRaw('LOWER(email) = ?', [$email])
                ->first(['id', 'lead_id', 'first_name', 'last_name', 'status']);
        }

        return inertia('portal/immigration/IntakeDetails', [
            'type' => $type,
            'intake' => $intake->toArray(),
            'assessment' => $assessment ? [
                'id' => $assessment->id,
                'status' => $assessment->status,
                'token' => $assessment->token,
                'paid_at' => $assessment->paid_at,
                'booking' => $assessment->booking ? [
                    'id' => $assessment->booking->id,
                    'status' => $assessment->booking->status,
                    'appointment_date' => $assessment->booking->appointment_date,
                    'appointment_time' => $assessment->booking->appointment_time,
                ] : null,
            ] : null,
            'linkedLead' => $lead ? [
                'id' => $lead->id,
                'lead_id' => $lead->lead_id,
                'name' => trim("{$lead->first_name} {$lead->last_name}") ?: 'Unknown',
                'status' => $lead->status,
            ] : null,
        ]);
    }

    /** Documents — Queue (pending / stale / rejected) + Folders per case. */
    public function documents()
    {
        try {
            $pending = LeadDocument::with('lead:id,first_name,last_name,lead_id')
                ->whereIn('status', ['Submitted', 'UnderReview'])
                ->orderBy('created_at')->limit(50)->get()
                ->map(fn ($d) => $this->docQueueRow($d, 'pending'));

            $stale = LeadDocument::with('lead:id,first_name,last_name,lead_id')
                ->where('status', 'Submitted')
                ->where('created_at', '<', now()->subDays(7))
                ->orderBy('created_at')->limit(30)->get()
                ->map(fn ($d) => $this->docQueueRow($d, 'stale'));

            $rejected = LeadDocument::with('lead:id,first_name,last_name,lead_id')
                ->where('status', 'Rejected')
                ->where('reviewed_at', '>', now()->subDays(14))
                ->orderByDesc('reviewed_at')->limit(30)->get()
                ->map(fn ($d) => $this->docQueueRow($d, 'rejected'));

            $folders = Lead::has('documents')
                ->with('documents:id,lead_id,status,checklist_key')
                ->orderBy('first_name')->limit(200)->get()
                ->map(fn ($l) => [
                    'id' => $l->id,
                    'lead_id' => $l->lead_id,
                    'name' => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
                    'total' => $l->documents->count(),
                    'approved' => $l->documents->where('status', 'Approved')->count(),
                    'pending' => $l->documents->whereIn('status', ['Submitted', 'UnderReview'])->count(),
                    'rejected' => $l->documents->where('status', 'Rejected')->count(),
                ]);

            return inertia('portal/immigration/Documents', [
                'pending' => $pending, 'stale' => $stale, 'rejected' => $rejected, 'folders' => $folders,
            ]);
        } catch (\Throwable $e) {
            Log::error('Immigration documents page failed', ['error' => $e->getMessage()]);

            return inertia('portal/immigration/Documents', ['pending' => [], 'stale' => [], 'rejected' => [], 'folders' => []]);
        }
    }

    private function docQueueRow($d, $bucket): array
    {
        return [
            'id' => $d->id,
            'bucket' => $bucket,
            'original_name' => $d->original_name,
            'status' => $d->status,
            'note' => $d->note,
            'created_at' => $d->created_at,
            'reviewed_at' => $d->reviewed_at,
            'checklist_key' => $d->checklist_key,
            'lead' => $d->lead ? [
                'id' => $d->lead->id,
                'lead_id' => $d->lead->lead_id,
                'name' => trim("{$d->lead->first_name} {$d->lead->last_name}") ?: 'Unknown',
            ] : null,
        ];
    }

    public function appointments()
    {
        try {
            $rows = Booking::orderByDesc('appointment_date')->limit(100)->get()
                ->map(fn ($b) => [
                    'id' => $b->id,
                    'name' => trim("{$b->first_name} {$b->last_name}") ?: 'Unknown',
                    'email' => $b->email,
                    'service_type' => $b->service_type,
                    'consultant_name' => $b->consultant_name,
                    'platform' => $b->platform,
                    'status' => $b->status ?: 'Pending',
                    'appointment_date' => $b->appointment_date ? \Illuminate\Support\Carbon::parse($b->appointment_date)->toDateString() : null,
                    'appointment_time' => $b->appointment_time,
                ]);

            return inertia('portal/immigration/Appointments', ['appointments' => $rows]);
        } catch (\Throwable $e) {
            Log::error('Immigration appointments page failed', ['error' => $e->getMessage()]);

            return inertia('portal/immigration/Appointments', ['appointments' => []]);
        }
    }

    public function reports(Request $request)
    {
        $period = in_array($request->input('period', 'weekly'), ['weekly', 'monthly', 'quarterly', 'custom'], true)
            ? $request->input('period', 'weekly') : 'weekly';

        return inertia('portal/immigration/Reports', [
            'period' => $period,
            'tiles' => [
                'active_cases' => Lead::where('status', 'Visa Process')->count(),
                'new_assessments' => ResidentIntake::where('created_at', '>=', now()->startOfWeek())->count(),
                'docs_pending' => LeadDocument::whereIn('status', ['Submitted', 'UnderReview'])->count(),
            ],
            'generated_at' => now()->toIso8601String(),
            'generated_by' => optional(auth()->user())->name,
        ]);
    }

    // Stubs — coming-soon pages.
    public function visaTypes()
    {
        return inertia('portal/immigration/VisaTypes', []);
    }

    public function intakes()
    {
        return inertia('portal/immigration/Intakes', []);
    }

    public function inzForms()
    {
        return inertia('portal/immigration/InzForms', []);
    }

    public function checklistTemplates()
    {
        return inertia('portal/immigration/ChecklistTemplates', []);
    }

    public function profile()
    {
        $me = auth()->user();

        return inertia('portal/immigration/Profile', [
            'user' => $me->only(['id', 'name', 'email', 'role', 'iaa_licence_number', 'iaa_licence_expiry']),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'iaa_licence_number' => 'nullable|string|max:60',
            'iaa_licence_expiry' => 'nullable|date',
        ]);
        try {
            $me = auth()->user();
            $me->fill($validated)->save();

            return back()->with('success', 'Profile updated.');
        } catch (\Throwable $e) {
            Log::error('Immigration profile update failed', ['error' => $e->getMessage()]);

            return back()->with('error', 'Could not update profile.');
        }
    }

    /**
     * Task Board page — mirrors the Sales/Education shape. See
     * App\Http\Controllers\Portal\SalesController::tasks() for the
     * canonical implementation; everything here is the same query keyed
     * off the current user. Department-scoping is UI-only for now until
     * LeadTask grows a department column.
     */
    public function tasks(Request $request)
    {
        try {
            $userId = $request->user()->id;
            $scope = $request->input('scope', 'mine');
            $now = now();
            $todayEnd = $now->copy()->endOfDay();
            $weekEnd = $now->copy()->endOfWeek();

            $base = \App\Models\LeadTask::with(['lead:id,lead_id,first_name,last_name,email,status', 'assignee:id,name', 'creator:id,name', 'attachments'])
                ->withCount('comments')
                ->when($scope === 'mine', fn ($q) => $q->where('assignee_id', $userId))
                ->when($scope === 'department', fn ($q) => $q->where('department', 'immigration'));

            $serialize = fn ($t) => [
                'id' => $t->id,
                'title' => $t->title,
                'description' => $t->description,
                'note' => $t->note,
                'comments_count' => (int) ($t->comments_count ?? 0),
                'priority' => $t->priority,
                'progress' => (int) ($t->progress ?? 0),
                'due_at' => $t->due_at,
                'completed' => $t->completed,
                'completed_at' => $t->completed_at,
                'overdue' => ! $t->completed && $t->due_at && $t->due_at->isPast(),
                'type' => $t->type,
                'category' => $t->category,
                'department' => $t->department,
                'tags' => $t->tags,
                'status' => $t->status,
                'completion_notes' => $t->completion_notes,
                'attachments' => $t->attachments->map(fn ($a) => [
                    'id' => $a->id,
                    'url' => $a->url,
                    'original_filename' => $a->original_filename,
                    'is_image' => $a->is_image,
                    'mime_type' => $a->mime_type,
                    'size' => $a->size,
                ])->values(),
                'assignee' => $t->assignee ? ['id' => $t->assignee->id, 'name' => $t->assignee->name] : null,
                'additional_assignee_ids' => $t->additional_assignee_ids ?? [],
                'additional_lead_ids' => $t->additional_lead_ids ?? [],
                'creator' => $t->creator ? ['id' => $t->creator->id,  'name' => $t->creator->name] : null,
                'lead' => $t->lead ? [
                    'id' => $t->lead->id,
                    'lead_id' => $t->lead->lead_id,
                    'name' => trim("{$t->lead->first_name} {$t->lead->last_name}"),
                    'status' => $t->lead->status,
                ] : null,
            ];

            // Full task set for the kanban (all dates, all statuses).
            $allTasks = (clone $base)->orderByDesc('created_at')->limit(1000)->get()->map($serialize);
            $today = (clone $base)->where('completed', false)->whereBetween('due_at', [$now, $todayEnd])->orderBy('due_at')->get()->map($serialize);
            $overdue = (clone $base)->where('completed', false)->whereNotNull('due_at')->where('due_at', '<', $now)->orderBy('due_at')->get()->map($serialize);
            $thisWeek = (clone $base)->where('completed', false)->whereBetween('due_at', [$todayEnd, $weekEnd])->orderBy('due_at')->get()->map($serialize);
            $undated = (clone $base)->where('completed', false)->whereNull('due_at')->orderByDesc('created_at')->limit(50)->get()->map($serialize);
            $recentlyDone = (clone $base)->where('completed', true)->where('completed_at', '>=', $now->copy()->subDays(7))->orderByDesc('completed_at')->limit(50)->get()->map($serialize);

            return inertia('portal/immigration/Tasks', [
                'portal' => 'immigration',
                'scope' => $scope,
                'all_tasks' => $allTasks,
                'today' => $today,
                'overdue' => $overdue,
                'this_week' => $thisWeek,
                'undated' => $undated,
                'recently_done' => $recentlyDone,
                'staffOptions' => \App\Models\User::whereNotIn('role', ['lead', 'revoked_lead'])->orderBy('name')->get(['id', 'name', 'role']),
                'recent_activity' => \App\Models\ActivityLog::where('action', 'like', 'lead_task.%')
                    ->latest()->limit(30)
                    ->get(['id', 'action', 'description', 'actor_name', 'actor_role', 'properties', 'created_at']),
            ]);
        } catch (\Throwable $e) {
            Log::error('Immigration tasks page failed', ['error' => $e->getMessage()]);

            return inertia('portal/immigration/Tasks', ['portal' => 'immigration', 'scope' => 'mine', 'today' => [], 'overdue' => [], 'this_week' => [], 'undated' => [], 'recently_done' => [], 'staffOptions' => []]);
        }
    }
}
