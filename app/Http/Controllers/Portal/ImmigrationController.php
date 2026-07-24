<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\Booking;
use App\Models\Event;
use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\ResidentIntake;
use App\Models\User;
use App\Models\UserReview;
use App\Traits\BuildsLeadRow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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
                    ->with([
                        'studyPlans', 'event', 'tags:id,name', 'portalUser:id,lead_id,last_login_at',
                        'stageUpdater:id,name', 'agent:id,name,avatar_path', 'notes' => fn ($q) => $q->latest(),
                        // Doc rows drive the "Docs progress" column in the
                        // leads table (via BuildsLeadRow::leadChecklistTotals).
                        'documents:id,lead_id,checklist_key,status',
                    ])
                    ->withCount(['notes', 'documents'])
                    ->latest()->get()->map(fn ($l) => $this->leadRow($l)),
                // Full tag dictionary — the Leads-page Tag filter lists every
                // tag ever created, not just the ones on visible leads.
                'allTagNames' => \App\Models\LeadTag::orderBy('name')->pluck('name'),
                'events' => $this->eventsSummary(),
                'tabCounts' => $this->leadTabCounts(),
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
            ->with('agent:id,name')
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
                'agent' => optional($e->agent)->name,
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

    /** GET /portal/immigration/events/{id}/registrants — full-page registrants view. */
    public function eventRegistrantsPage($id)
    {
        $event = Event::findOrFail($id);

        return inertia('portal/immigration/EventRegistrants', array_merge(
            $this->eventRegistrantsPayload($event),
            ['portalBase' => '/portal/immigration']
        ));
    }

    /**
     * Cases — leads that have engaged Immigration (currently proxied via
     * Visa Process stage; a dedicated is_immigration_case flag is the next
     * piece of infra to add, mirroring is_student).
     */
    public function cases()
    {
        try {
            // Preload each visa type's checklist so per-case document
            // progress can be measured against the required checklist items
            // (how many the case has actually submitted), not the raw
            // upload count.
            $visaChecklists = \App\Models\VisaType::query()
                ->get(['name', 'checklist_items'])
                ->mapWithKeys(fn ($v) => [$v->name => (is_array($v->checklist_items) ? $v->checklist_items : [])]);

            $cases = Lead::with([
                'documents',
                'faceImage',
                'portalUser:id,lead_id,last_login_at',
                'immigrationConverter:id,name',
                'studentConverter:id,name',
                'stageUpdater:id,name',
                'lastActivityUser:id,name',
            ])
                ->immigrationCase()
                // Newest staff activity first, falling back to the raw
                // timestamp for rows stamped before the column existed.
                ->orderByRaw('COALESCE(last_activity_at, updated_at) DESC')
                ->limit(200)
                ->get()
                ->map(function ($l) use ($visaChecklists) {
                    // All checklist keys for this case's visa vs. the keys it
                    // has actually submitted (any non-rejected doc). Progress
                    // is measured against the full checklist, not just the
                    // required subset.
                    $checklistKeys = collect($visaChecklists[$l->inz_visa_type] ?? [])
                        ->pluck('key')->filter()->unique();
                    $submittedKeys = $l->documents
                        ->whereNotNull('checklist_key')
                        ->whereIn('status', ['Submitted', 'UnderReview', 'Approved'])
                        ->pluck('checklist_key')->unique();

                    return [
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
                        'avatar_url' => $l->faceImageUrl(),
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
                        // Checklist-based progress: how many of the visa's
                        // checklist items the case has submitted (out of the
                        // full checklist).
                        'checklist_total' => $checklistKeys->count(),
                        'checklist_submitted' => $checklistKeys->intersect($submittedKeys)->count(),
                        // Updated column — the last *staff* edit of any kind
                        // (stage moves, profile fields, visa details…),
                        // stamped by Lead::stampLastActivity(). Older rows
                        // predate the stamp, so fall back to the raw
                        // timestamp and the last known handler.
                        'updated_at' => optional($l->last_activity_at ?: $l->updated_at)?->toIso8601String(),
                        'updated_by' => optional($l->lastActivityUser)->name
                                                ?? optional($l->stageUpdater)->name
                                                ?? optional($l->immigrationConverter)->name
                                                ?? optional($l->studentConverter)->name,
                        // Short summary of what that edit changed.
                        'updated_desc' => $l->last_activity_desc,
                    ];
                });

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

            // Priority breakdown for the counters above the table — one per
            // level plus a "none" bucket for cases with no priority set.
            $priorities = [
                'urgent' => $cases->where('immigration_priority', 'urgent')->count(),
                'high' => $cases->where('immigration_priority', 'high')->count(),
                'medium' => $cases->where('immigration_priority', 'medium')->count(),
                'low' => $cases->where('immigration_priority', 'low')->count(),
                'done' => $cases->where('immigration_priority', 'done')->count(),
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
                'priorities' => ['urgent' => 0, 'high' => 0, 'medium' => 0, 'low' => 0, 'done' => 0, 'none' => 0],
                'stages' => Lead::IMMIGRATION_STAGES,
                'visaTypes' => [],
            ]);
        }
    }

    /**
     * Lightweight case list shared by the Engagement + Invoice generation
     * workspaces. Returns just enough per-case detail to pick a case and
     * generate the relevant document, without the full Cases-page payload.
     */
    private function caseListForGeneration()
    {
        return Lead::immigrationCase()
            ->orderByDesc('updated_at')
            ->limit(300)
            ->get(['id', 'lead_id', 'first_name', 'last_name', 'email', 'phone', 'residence_country', 'inz_visa_type', 'immigration_stage'])
            ->map(fn ($l) => [
                'id' => $l->id,
                'lead_id' => $l->lead_id,
                'name' => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
                'email' => $l->email,
                'phone' => $l->phone,
                'country' => $l->residence_country,
                'inz_visa_type' => $l->inz_visa_type,
                'immigration_stage' => $l->immigration_stage,
            ])
            ->values();
    }

    /**
     * Engagement generation workspace — pick a case, choose which
     * engagement documents to generate (Written Agreement + IAA
     * standards), preview them live, and generate. The Written Agreement's
     * fees come from the case's visa on the Visas page.
     */
    public function engagement()
    {
        try {
            // Visa fee lookup so the picker can flag cases whose visa has
            // no fees set (the Written Agreement would render placeholders).
            $visaFees = \App\Models\VisaType::query()
                ->get(['name', 'professional_fees', 'professional_fees_discounted', 'inz_application_fee'])
                ->mapWithKeys(fn ($v) => [$v->name => [
                    'professional_fees' => $v->professional_fees !== null ? (float) $v->professional_fees : null,
                    // Raw value — null when genuinely unset, so the UI can
                    // tell "no discount" from "discounted == normal".
                    'professional_fees_discounted' => $v->professional_fees_discounted !== null ? (float) $v->professional_fees_discounted : null,
                    'inz_application_fee' => $v->inz_application_fee !== null ? (float) $v->inz_application_fee : null,
                ]]);

            $cases = Lead::immigrationCase()
                ->orderByDesc('updated_at')
                ->limit(300)
                ->get(['id', 'lead_id', 'first_name', 'last_name', 'email', 'phone', 'residence_country', 'inz_visa_type', 'immigration_stage'])
                ->map(function ($l) use ($visaFees) {
                    $fees = $visaFees[$l->inz_visa_type] ?? null;

                    return [
                        'id' => $l->id,
                        'lead_id' => $l->lead_id,
                        'name' => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
                        'email' => $l->email,
                        'phone' => $l->phone,
                        'country' => $l->residence_country,
                        'inz_visa_type' => $l->inz_visa_type,
                        'immigration_stage' => $l->immigration_stage,
                        'professional_fees' => $fees['professional_fees'] ?? null,
                        'professional_fees_discounted' => $fees['professional_fees_discounted'] ?? null,
                        'inz_application_fee' => $fees['inz_application_fee'] ?? null,
                    ];
                })
                ->values();

            $generated = LeadDocument::with([
                'lead:id,first_name,last_name,lead_id,email,phone',
                'lead.faceImage',
                'uploader:id,name',
            ])
                ->where('source_variant', 'like', 'engagement:%')
                ->orderByDesc('created_at')
                ->limit(300)
                ->get()
                // One row per CASE — the case's generated documents are
                // nested so the table renders a single line per applicant
                // instead of one line per file.
                ->groupBy('lead_id')
                ->map(function ($docs) {
                    $first = $docs->first(); // newest first (ordered desc)
                    $lead = $first->lead;

                    return [
                        'case_id' => $first->lead_id,
                        'case_name' => $lead ? trim("{$lead->first_name} {$lead->last_name}") : '—',
                        'case_ref' => $lead?->lead_id,
                        'avatar_url' => $lead?->faceImageUrl(),
                        'email' => $lead?->email,
                        'phone' => $lead?->phone,
                        'latest_created_at' => optional($first->created_at)?->toIso8601String(),
                        'latest_by' => $first->uploader?->name,
                        'documents' => $docs->map(fn ($d) => [
                            'id' => $d->id,
                            'type_label' => \App\Services\Immigration\EngagementDocumentGenerator::DOCS[str_replace('engagement:', '', $d->source_variant)]['label']
                                ?? 'Document',
                            'size' => $d->size,
                            'signed' => (bool) $d->client_signed_at,
                            'created_at' => optional($d->created_at)?->toIso8601String(),
                            'uploaded_by' => $d->uploader?->name,
                            'download_url' => route('admin.documents.download', $d->id),
                            'view_url' => route('admin.documents.download', $d->id).'?inline=1',
                        ])->values(),
                    ];
                })
                ->values();

            return inertia('portal/immigration/Engagement', [
                'cases' => $cases,
                'documents' => \App\Services\Immigration\EngagementDocumentGenerator::catalogue(),
                'generated' => $generated,
                'signers' => $this->signingAdvisers(),
                'me_id' => auth()->id(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Immigration engagement page failed', ['error' => $e->getMessage()]);

            return inertia('portal/immigration/Engagement', [
                'cases' => [],
                'documents' => \App\Services\Immigration\EngagementDocumentGenerator::catalogue(),
                'generated' => [],
                'signers' => $this->signingAdvisers(),
                'me_id' => auth()->id(),
            ]);
        }
    }

    /**
     * Licensed immigration advisers who can sign engagement documents.
     *
     * Immigration staff and advisers share the same portal role, so the
     * signer isn't a role distinction — an "adviser" is anyone who holds an
     * IAA licence number (the NZ-licensed advisers, e.g. the full-licence
     * and provisional advisers). Non-adviser staff are excluded. Each row
     * carries a `has_signature` flag so the picker can warn when the chosen
     * adviser hasn't set a signature up yet.
     */
    private function signingAdvisers(): \Illuminate\Support\Collection
    {
        return User::whereNotNull('iaa_licence_number')
            ->where('iaa_licence_number', '!=', '')
            ->orderBy('name')
            ->get(['id', 'name', 'iaa_licence_number', 'signature_path'])
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'licence' => $u->iaa_licence_number,
                // Checks the file, not just the column — a stale path would
                // otherwise suppress the "no signature" warning while the
                // agreement still renders a blank signature line.
                'has_signature' => $u->hasSignature(),
            ])
            ->values();
    }

    /**
     * Invoice generation workspace — pick a case and generate its invoice.
     */
    public function invoice()
    {
        try {
            // Visa fees drive the invoice's default line items, so the
            // picker can pre-fill amounts (and flag visas with none set).
            $visaFees = \App\Models\VisaType::query()
                ->get(['name', 'professional_fees', 'professional_fees_discounted', 'inz_application_fee'])
                ->mapWithKeys(fn ($v) => [$v->name => [
                    'professional_fees' => $v->professional_fees !== null ? (float) $v->professional_fees : null,
                    // Raw value — null when genuinely unset, so the UI can
                    // tell "no discount" from "discounted == normal".
                    'professional_fees_discounted' => $v->professional_fees_discounted !== null ? (float) $v->professional_fees_discounted : null,
                    'inz_application_fee' => $v->inz_application_fee !== null ? (float) $v->inz_application_fee : null,
                ]]);

            $cases = Lead::immigrationCase()
                ->with('faceImage')
                ->orderByDesc('updated_at')
                ->limit(300)
                ->get(['id', 'lead_id', 'first_name', 'last_name', 'email', 'phone', 'residence_country', 'inz_visa_type', 'immigration_stage'])
                ->map(function ($l) use ($visaFees) {
                    $fees = $visaFees[$l->inz_visa_type] ?? null;

                    return [
                        'id' => $l->id,
                        'lead_id' => $l->lead_id,
                        'name' => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
                        'email' => $l->email,
                        'phone' => $l->phone,
                        'inz_visa_type' => $l->inz_visa_type,
                        'immigration_stage' => $l->immigration_stage,
                        'professional_fees' => $fees['professional_fees'] ?? null,
                        'professional_fees_discounted' => $fees['professional_fees_discounted'] ?? null,
                        'inz_application_fee' => $fees['inz_application_fee'] ?? null,
                    ];
                })
                ->values();

            // Generated invoices — one row per case, invoices nested.
            $generated = LeadDocument::with([
                'lead:id,first_name,last_name,lead_id,email,phone',
                'lead.faceImage',
                'uploader:id,name',
            ])
                ->where('source_variant', 'invoice')
                ->orderByDesc('created_at')
                ->limit(300)
                ->get()
                ->groupBy('lead_id')
                ->map(function ($docs) {
                    $first = $docs->first();
                    $lead = $first->lead;

                    return [
                        'case_id' => $first->lead_id,
                        'case_name' => $lead ? trim("{$lead->first_name} {$lead->last_name}") : '—',
                        'case_ref' => $lead?->lead_id,
                        'avatar_url' => $lead?->faceImageUrl(),
                        'email' => $lead?->email,
                        'phone' => $lead?->phone,
                        'latest_created_at' => optional($first->created_at)?->toIso8601String(),
                        'latest_by' => $first->uploader?->name,
                        'invoices' => $docs->map(fn ($d) => [
                            'id' => $d->id,
                            'number' => $d->invoice_number,
                            'size' => $d->size,
                            'created_at' => optional($d->created_at)?->toIso8601String(),
                            'download_url' => route('admin.documents.download', $d->id),
                            'view_url' => route('admin.documents.download', $d->id).'?inline=1',
                        ])->values(),
                    ];
                })
                ->values();

            return inertia('portal/immigration/Invoice', [
                'cases' => $cases,
                'generated' => $generated,
                'nextNumber' => app(\App\Services\Immigration\InvoiceGenerator::class)->nextInvoiceNumber(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Immigration invoice page failed', ['error' => $e->getMessage()]);

            return inertia('portal/immigration/Invoice', ['cases' => [], 'generated' => [], 'nextNumber' => null]);
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
     * Inline priority update from the Cases table's expanded row.
     */
    public function updateCasePriority(\Illuminate\Http\Request $request, $id)
    {
        $lead = Lead::immigrationCase()->findOrFail($id);

        $data = $request->validate([
            'immigration_priority' => ['nullable', \Illuminate\Validation\Rule::in(Lead::IMMIGRATION_PRIORITIES)],
        ]);

        $lead->immigration_priority = $data['immigration_priority'] ?? null;
        $lead->save();

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
                // Find-or-create the Lead. Emails are NOT unique to a person
                // (a parent often registers several people under one email),
                // so a same-email lead is only the right target when the NAME
                // also matches — otherwise we'd attach this assessment to a
                // different person's case.
                $email = $intake->email ?: $assessment->applicant_email;
                $wantLast = strtolower(trim((string) $lastName));
                $wantFirst = strtolower(trim((string) ($intake->first_name ?? $assessment->applicant_first_name ?? '')));

                $lead = null;

                // 1. Same email AND matching last name — the confident match.
                if ($email && $wantLast !== '') {
                    $lead = Lead::where('email', $email)->get()
                        ->first(fn ($l) => strtolower(trim((string) $l->last_name)) === $wantLast);
                }

                // 2. No email match — a staff-created case may exist under the
                //    same name with no email on it yet. Link only when the
                //    first + last name match is unambiguous (exactly one).
                if (! $lead && $wantFirst !== '' && $wantLast !== '') {
                    $named = Lead::whereRaw('LOWER(TRIM(last_name)) = ?', [$wantLast])
                        ->whereRaw('LOWER(TRIM(first_name)) = ?', [$wantFirst])
                        ->limit(2)->get();
                    if ($named->count() === 1) {
                        $lead = $named->first();
                    }
                }

                // 3. Nothing matched → create a fresh case for this applicant
                //    (below) rather than hijacking a same-email row.

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
                // label without changing the conversion date. assessment_id
                // is always (re)linked so the case profile resolves THIS
                // exact assessment, not a same-email one.
                $patch = ['inz_visa_type' => $visaName, 'assessment_id' => $assessment->id];
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

            // Pre-compute which Assessment ids already map to a Lead flagged
            // as an immigration case. Matching by the exact assessment_id
            // (not email) means only the assessment actually converted shows
            // as "Converted" — a second same-email applicant's assessment
            // stays convertible on its own.
            $convertedAssessmentIds = Lead::query()
                ->where('is_immigration_case', true)
                ->whereNotNull('assessment_id')
                ->pluck('assessment_id')
                ->flip();

            $normalize = function ($intake, string $visaType, $assessment) use ($convertedAssessmentIds): array {
                $first = (string) ($intake->first_name ?? '');
                $last = (string) ($intake->last_name ?? $intake->family_name ?? '');
                $hasAssessment = (bool) $assessment;

                // Triaged — staff have changed the intake status away from
                // the default "Submitted"/"submitted"/"New" set. Anything
                // else counts.
                $defaultStatuses = ['Submitted', 'submitted', 'New', 'new'];
                $isTriaged = $intake->status !== null
                    && ! in_array($intake->status, $defaultStatuses, true);

                // Converted — this exact assessment is linked to a case, or
                // the intake itself has been marked "Engaged" post-convert.
                $isConverted = ($assessment && isset($convertedAssessmentIds[$assessment->id]))
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

        // Resolve the case this intake was converted into. Prefer the exact
        // assessment_id link (a shared email points at the wrong person), and
        // only fall back to email when the name also matches.
        $lead = null;
        if ($assessment) {
            $lead = Lead::where('assessment_id', $assessment->id)
                ->first(['id', 'lead_id', 'first_name', 'last_name', 'status']);
        }
        $email = strtolower(trim((string) ($intake->email ?? '')));
        $wantLast = strtolower(trim((string) ($intake->last_name ?? $intake->family_name ?? '')));
        $wantFirst = strtolower(trim((string) ($intake->first_name ?? '')));

        if (! $lead && $email !== '') {
            $candidates = Lead::where('is_immigration_case', true)
                ->whereRaw('LOWER(email) = ?', [$email])
                ->get(['id', 'lead_id', 'first_name', 'last_name', 'status']);
            $lead = $candidates->first(fn ($l) => $wantLast !== '' && strtolower(trim((string) $l->last_name)) === $wantLast);
            // No confident name match on a shared email → don't claim a link.
        }

        // Name match — covers a staff-created case with no email on it.
        // Only link when the first + last name match is unambiguous.
        if (! $lead && $wantFirst !== '' && $wantLast !== '') {
            $named = Lead::where('is_immigration_case', true)
                ->whereRaw('LOWER(TRIM(last_name)) = ?', [$wantLast])
                ->whereRaw('LOWER(TRIM(first_name)) = ?', [$wantFirst])
                ->limit(2)
                ->get(['id', 'lead_id', 'first_name', 'last_name', 'status']);
            if ($named->count() === 1) {
                $lead = $named->first();
            }
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
            $rows = Booking::where('service_type', 'like', '%Immigration%')
                ->with('visaType:id,name,code')
                ->orderByDesc('appointment_date')->limit(300)->get()
                ->map(fn ($b) => [
                    'id' => $b->id,
                    'name' => trim("{$b->first_name} {$b->last_name}") ?: 'Unknown',
                    'email' => $b->email,
                    'phone' => $b->phone,
                    'service_type' => $b->service_type,
                    'visa' => $b->visaType?->name,
                    'consultant_name' => $b->consultant_name,
                    'platform' => $b->platform,
                    'status' => $b->status ?: 'Pending',
                    'payment_status' => $b->payment_status ?: 'unpaid',
                    'amount' => $b->amount,
                    'currency' => $b->currency,
                    'appointment_date' => $b->appointment_date ? \Illuminate\Support\Carbon::parse($b->appointment_date)->toDateString() : null,
                    'appointment_time' => $b->appointment_time,
                    'created_at' => optional($b->created_at)->toIso8601String(),
                ]);

            return inertia('portal/immigration/Appointments', array_merge(
                ['appointments' => $rows],
                $this->availabilityProps(),
            ));
        } catch (\Throwable $e) {
            Log::error('Immigration appointments page failed', ['error' => $e->getMessage()]);

            return inertia('portal/immigration/Appointments', array_merge(
                ['appointments' => []],
                $this->availabilityProps(),
            ));
        }
    }

    /** Current user's availability + the immigration team's, for the settings tab. */
    private function availabilityProps(): array
    {
        $me = auth()->user();
        $default = \App\Models\StaffAvailability::defaultSchedule();
        $saved = \App\Models\StaffAvailability::pluck('schedule', 'user_id');

        $staff = \App\Models\User::whereIn('role', ['immigration', 'immigration_manager', 'immigration_adviser'])
            ->orderBy('name')->get(['id', 'name', 'role']);

        // Ensure the acting user (e.g. an admin) can always set their own hours.
        if ($me && ! $staff->contains('id', $me->id)) {
            $staff->push($me);
        }

        return [
            'currentUserId' => $me?->id,
            'myAvailability' => ($me && isset($saved[$me->id])) ? $saved[$me->id] : $default,
            'teamAvailability' => $staff->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'role' => $u->role,
                'schedule' => $saved[$u->id] ?? $default,
                'is_set' => isset($saved[$u->id]),
            ])->values(),
        ];
    }

    /** Save the acting user's weekly availability. */
    public function saveAvailability(Request $request)
    {
        $data = $request->validate([
            'schedule' => 'required|array',
            'schedule.*.enabled' => 'required|boolean',
            'schedule.*.start' => 'nullable|date_format:H:i',
            'schedule.*.end' => 'nullable|date_format:H:i',
        ]);

        // Keep only known days.
        $schedule = array_intersect_key($data['schedule'], array_flip(\App\Models\StaffAvailability::DAYS));

        \App\Models\StaffAvailability::updateOrCreate(
            ['user_id' => $request->user()->id],
            ['schedule' => $schedule],
        );

        return back()->with('success', 'Your availability has been saved.');
    }

    /** Re-send the booking confirmation + invoice email to the client. */
    public function resendInvoice($id)
    {
        $booking = Booking::findOrFail($id);

        if (empty($booking->email)) {
            return back()->with('error', 'This booking has no email address.');
        }

        try {
            // Queued so the SMTP round-trip never blocks the single-threaded
            // dev server (which caused the page to blank mid-send).
            \Illuminate\Support\Facades\Mail::to($booking->email)
                ->queue(new \App\Mail\BookingConfirmationMail($booking->fresh('visaType')));

            return back()->with('success', 'Invoice re-sent to '.$booking->email.'.');
        } catch (\Throwable $e) {
            Log::error('Resend invoice failed', ['booking_id' => $booking->id, 'error' => $e->getMessage()]);

            return back()->with('error', 'Could not send the invoice. Please try again.');
        }
    }

    public function reports(Request $request)
    {
        $period = in_array($request->input('period', 'weekly'), ['weekly', 'monthly', 'quarterly', 'custom'], true)
            ? $request->input('period', 'weekly') : 'weekly';

        $now = now();
        $weekStart = $now->copy()->startOfWeek();

        // Stage groupings (based on the case's current immigration_stage).
        $awaitingStages = ['Visa Lodged', 'Request for Information', 'Approved in Principle'];
        $inProgress = ['For Assessment', 'Endorsed', 'Agreement Sent', 'Agreement Signed', 'For Agreement & Invoice', 'Invoice Paid'];
        $lodgedStages = ['Visa Lodged', 'Request for Information', 'Approved in Principle', 'Approved Visa', 'Decline Visa'];
        $endorsedStages = ['Endorsed', 'Agreement Sent', 'Agreement Signed', 'For Agreement & Invoice', 'Invoice Paid', 'Visa Lodged', 'Request for Information', 'Approved in Principle', 'Approved Visa', 'Decline Visa'];
        $engagedStages = ['Agreement Signed', 'For Agreement & Invoice', 'Invoice Paid', 'Visa Lodged', 'Request for Information', 'Approved in Principle', 'Approved Visa', 'Decline Visa'];

        $count = fn ($stages) => Lead::immigrationCase()->whereIn('immigration_stage', (array) $stages)->count();
        $countWeek = fn ($stages) => Lead::immigrationCase()
            ->whereIn('immigration_stage', (array) $stages)
            ->where('stage_updated_at', '>=', $weekStart)
            ->count();

        // Adviser most cases were endorsed/assigned to this week.
        $adviser = Lead::immigrationCase()
            ->whereNotNull('immigration_assignee')
            ->where('stage_updated_at', '>=', $weekStart)
            ->selectRaw('immigration_assignee, COUNT(*) as c')
            ->groupBy('immigration_assignee')
            ->orderByDesc('c')
            ->first();

        $weekly = [
            'new_clients' => Lead::immigrationCase()->where('immigration_converted_at', '>=', $weekStart)->count(),
            'files_endorsed' => $countWeek(['For Assessment', 'Endorsed']),
            'endorsed_to' => $adviser->immigration_assignee ?? (Lead::IMMIGRATION_STAGE_ASSIGNEES[0] ?? 'the team'),
            'endorsed_to_count' => (int) ($adviser->c ?? 0),
            'agreements_signed' => $countWeek('Agreement Signed'),
            'apps_lodged' => $countWeek('Visa Lodged'),
            'visas_approved' => $countWeek('Approved Visa'),
        ];

        $pipeline = [
            'ready' => $count('Invoice Paid'),
            'in_progress' => $count($inProgress),
            'awaiting_decision' => $count($awaitingStages),
        ];

        // ── Cases by stage — the full pipeline breakdown (primary focus) ──
        $stageDistribution = collect(Lead::IMMIGRATION_STAGES)
            ->map(fn ($s) => ['stage' => $s, 'count' => $count($s)])
            ->push(['stage' => 'Unassigned', 'count' => Lead::immigrationCase()->whereNull('immigration_stage')->count()])
            ->values();
        $totalCases = $stageDistribution->sum('count');

        // ── Documents submitted this week (secondary focus) ──────────────
        $docWeek = fn () => LeadDocument::where('created_at', '>=', $weekStart);
        $byDay = [];
        for ($i = 0; $i < 7; $i++) {
            $day = $weekStart->copy()->addDays($i);
            $byDay[] = [
                'label' => $day->format('D'),
                'count' => LeadDocument::whereBetween('created_at', [$day->copy()->startOfDay(), $day->copy()->endOfDay()])->count(),
            ];
        }
        $documents = [
            'total' => (clone $docWeek())->count(),
            'approved' => (clone $docWeek())->where('status', 'Approved')->count(),
            'pending' => (clone $docWeek())->whereIn('status', ['Submitted', 'UnderReview'])->count(),
            'rejected' => (clone $docWeek())->where('status', 'Rejected')->count(),
            'pending_review_all' => LeadDocument::whereIn('status', ['Submitted', 'UnderReview'])->count(),
            'by_day' => $byDay,
        ];

        // ── 6-month trend — new cases vs visas approved per month ────────
        $trend = [];
        for ($i = 5; $i >= 0; $i--) {
            $m = $now->copy()->subMonths($i);
            $start = $m->copy()->startOfMonth();
            $end = $m->copy()->endOfMonth();
            $trend[] = [
                'label' => $m->format('M'),
                'new_cases' => Lead::immigrationCase()->whereBetween('immigration_converted_at', [$start, $end])->count(),
                'approved' => Lead::immigrationCase()->where('immigration_stage', 'Approved Visa')->whereBetween('stage_updated_at', [$start, $end])->count(),
            ];
        }

        $approved = $count('Approved Visa');
        $declined = $count('Decline Visa');
        $decided = $approved + $declined;

        $kpis = [
            'active_cases' => Lead::immigrationCase()->count(),
            'with_inz' => $count($awaitingStages),
            'docs_pending' => $documents['pending_review_all'],
            'approval_rate' => $decided > 0 ? (int) round($approved / $decided * 100) : 0,
        ];

        $ytd = [
            'total_clients' => Lead::immigrationCase()->count(),
            'endorsed' => $count($endorsedStages),
            'lodged' => $count($lodgedStages),
            'approved' => $approved,
            'engagements' => $count($engagedStages),
            'declined' => $declined,
            'decided' => $decided,
            'approval_rate' => $decided > 0 ? (int) round($approved / $decided * 100) : 0,
        ];

        return inertia('portal/immigration/Reports', [
            'period' => $period,
            'kpis' => $kpis,
            'weekly' => $weekly,
            'stageDistribution' => $stageDistribution,
            'totalCases' => $totalCases,
            'documents' => $documents,
            'trend' => $trend,
            'ytd' => $ytd,
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
            'user' => $me->only(['id', 'name', 'email', 'role', 'iaa_licence_number', 'iaa_licence_type', 'iaa_licence_expiry']),
            'signature' => [
                'data_uri' => $me->signatureDataUri(),
                'updated_at' => optional($me->signature_updated_at)?->toIso8601String(),
            ],
        ]);
    }

    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'iaa_licence_number' => 'nullable|string|max:60',
            'iaa_licence_type' => 'nullable|string|in:Full,Provisional,Limited',
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
     * Save the staff member's e-signature — accepts either a drawn canvas
     * PNG (base64 data URL) or an uploaded image. Stored privately and
     * rendered onto engagement documents this user signs.
     */
    public function saveSignature(Request $request)
    {
        $request->validate([
            'signature_image' => 'nullable|image|mimes:png,jpg,jpeg|max:2048',
            'signature_data' => 'nullable|string',
        ]);

        $me = auth()->user();

        try {
            $binary = null;
            $ext = 'png';

            if ($request->hasFile('signature_image')) {
                $file = $request->file('signature_image');
                $binary = file_get_contents($file->getRealPath());
                $ext = strtolower($file->getClientOriginalExtension()) === 'jpg' ? 'jpeg' : strtolower($file->getClientOriginalExtension());
                $ext = in_array($ext, ['png', 'jpeg'], true) ? $ext : 'png';
            } elseif ($request->filled('signature_data')) {
                // data:image/png;base64,XXXX  → raw bytes
                $data = $request->input('signature_data');
                if (preg_match('/^data:image\/(png|jpe?g);base64,/', $data, $m)) {
                    $ext = str_starts_with($m[1], 'jp') ? 'jpeg' : 'png';
                    $data = substr($data, strpos($data, ',') + 1);
                }
                $binary = base64_decode(str_replace(' ', '+', $data), true);
            }

            if (! $binary) {
                return back()->withErrors(['error' => 'No signature provided.']);
            }

            // Overwrite any previous signature file for this user.
            if ($me->signature_path) {
                Storage::disk('local')->delete($me->signature_path);
            }

            $path = "signatures/user-{$me->id}-".Str::random(8).".{$ext}";
            Storage::disk('local')->put($path, $binary);

            $me->forceFill([
                'signature_path' => $path,
                'signature_updated_at' => now(),
            ])->save();

            return back()->with('success', 'Signature saved.');
        } catch (\Throwable $e) {
            Log::error('Signature save failed', ['user_id' => $me?->id, 'error' => $e->getMessage()]);

            return back()->withErrors(['error' => 'Could not save the signature.']);
        }
    }

    /** Remove the staff member's stored e-signature. */
    public function deleteSignature(Request $request)
    {
        $me = auth()->user();

        try {
            if ($me->signature_path) {
                Storage::disk('local')->delete($me->signature_path);
            }
            $me->forceFill(['signature_path' => null, 'signature_updated_at' => null])->save();

            return back()->with('success', 'Signature removed.');
        } catch (\Throwable $e) {
            Log::error('Signature delete failed', ['user_id' => $me?->id, 'error' => $e->getMessage()]);

            return back()->withErrors(['error' => 'Could not remove the signature.']);
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

            $base = \App\Models\LeadTask::with(['lead:id,lead_id,first_name,last_name,email,status', 'assignee:id,name,avatar_path', 'creator:id,name,avatar_path', 'attachments'])
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
                'assignee' => $t->assignee ? ['id' => $t->assignee->id, 'name' => $t->assignee->name, 'avatar_url' => $t->assignee->avatar_url] : null,
                'additional_assignee_ids' => $t->additional_assignee_ids ?? [],
                'additional_lead_ids' => $t->additional_lead_ids ?? [],
                'creator' => $t->creator ? ['id' => $t->creator->id,  'name' => $t->creator->name, 'avatar_url' => $t->creator->avatar_url] : null,
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
                'staffOptions' => \App\Models\User::whereNotIn('role', ['lead', 'revoked_lead'])->orderBy('name')->get(['id', 'name', 'role', 'avatar_path']),
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
