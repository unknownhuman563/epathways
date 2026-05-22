<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\ResidentIntake;
use App\Models\UserReview;
use App\Traits\BuildsLeadRow;
use Illuminate\Http\Request;
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
            $weekStart  = $now->copy()->startOfWeek();
            $monthStart = $now->copy()->startOfMonth();

            // ── Top tiles ──────────────────────────────────────────────────
            $activeCases   = Lead::where('is_immigration_case', true)->count();
            $newAssessmentsThisWeek = ResidentIntake::where('created_at', '>=', $weekStart)->count();
            $bookingsPaidUnseen = Booking::where('status', 'Confirmed')->whereNull('appointment_date')->count();
            $docsPendingReview  = LeadDocument::whereIn('status', ['Submitted', 'UnderReview'])->count();
            $casesLodged        = Lead::where('is_immigration_case', true)->whereIn('inz_status', ['Lodged', 'Decision Pending', 'Info Requested'])->count();
            $infoRequests       = Lead::where('is_immigration_case', true)->where('inz_status', 'Info Requested')->count();

            // ── INZ pipeline aging (green / amber / red) ─────────────────
            $visaTypes = \App\Models\VisaType::pluck('expected_processing_days', 'name')->all();
            $defaultWindow = 40; // fallback when visa-type not in catalog
            $inzCases = Lead::where('is_immigration_case', true)
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
                    'id'            => $c->id,
                    'lead_id'       => $c->lead_id,
                    'name'          => trim("{$c->first_name} {$c->last_name}") ?: 'Unknown',
                    'visa_type'     => $c->inz_visa_type,
                    'lodged_at'     => $c->inz_lodged_at,
                    'days_since'    => $daysSince,
                    'expected_days' => $window,
                    'bucket'        => $bucket,
                    'status'        => $c->inz_status,
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
                    'expiry'         => $expiry ? $expiry->toDateString() : null,
                    'days_to_expiry' => $expiry ? (int) now()->diffInDays($expiry, false) : null,
                    'status'         => ! $me->iaa_licence_number ? 'missing'
                        : (! $expiry ? 'no_expiry'
                            : ((int) now()->diffInDays($expiry, false) < 0 ? 'expired'
                                : ((int) now()->diffInDays($expiry, false) <= 60 ? 'expiring' : 'ok'))),
                ];
            }

            // ── 6-month intakes trend (kept from old dashboard) ────────────
            $monthly = [];
            for ($i = 5; $i >= 0; $i--) {
                $mStart = $now->copy()->subMonths($i)->startOfMonth();
                $mEnd   = $now->copy()->subMonths($i)->endOfMonth();
                $monthly[] = [
                    'label'   => $mStart->format('M'),
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
                'assessments_pending'  => ResidentIntake::whereIn('status', ['New', null])->count(),
                'paid_unscheduled'     => $bookingsPaidUnseen,
                'rejected_docs'        => LeadDocument::where('status', 'Rejected')->where('reviewed_at', '>', $now->copy()->subDays(14))->count(),
                'agreements_pending'   => Lead::where('status', 'Consultancy Agreement')->count(),
            ];

            // ── This week's appointments ───────────────────────────────────
            $weekEnd = $now->copy()->endOfWeek();
            $weekAppts = Booking::whereBetween('appointment_date', [$weekStart, $weekEnd])
                ->orderBy('appointment_date')->orderBy('appointment_time')
                ->limit(8)->get()
                ->map(fn ($b) => [
                    'id'               => $b->id,
                    'name'             => trim("{$b->first_name} {$b->last_name}") ?: 'Unknown',
                    'service_type'     => $b->service_type,
                    'consultant_name'  => $b->consultant_name,
                    'platform'         => $b->platform,
                    'status'           => $b->status ?: 'Pending',
                    'appointment_date' => $b->appointment_date ? \Illuminate\Support\Carbon::parse($b->appointment_date)->toDateString() : null,
                    'appointment_time' => $b->appointment_time,
                ]);

            return inertia('portal/immigration/Dashboard', [
                'tiles' => [
                    'active_cases'             => $activeCases,
                    'new_assessments_week'     => $newAssessmentsThisWeek,
                    'bookings_paid_unseen'     => $bookingsPaidUnseen,
                    'docs_pending_review'      => $docsPendingReview,
                    'cases_lodged'             => $casesLodged,
                    'info_requests_outstanding'=> $infoRequests,
                ],
                'pipeline'      => $pipeline,
                'inz_aging'     => $inzAging,
                'iaa'           => $iaa,
                'monthly'       => $monthly,
                'urgent'        => $urgent,
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
                'portal'   => 'immigration',
                'statuses' => self::LEAD_STATUSES,
                'leads'    => Lead::with(['studyPlans', 'event', 'portalUser:id,lead_id,last_login_at'])
                    ->latest()->get()->map(fn ($l) => $this->leadRow($l)),
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

    /**
     * Cases — leads that have engaged Immigration (currently proxied via
     * Visa Process stage; a dedicated is_immigration_case flag is the next
     * piece of infra to add, mirroring is_student).
     */
    public function cases()
    {
        try {
            $cases = Lead::with(['documents', 'portalUser:id,lead_id,last_login_at'])
                ->where('is_immigration_case', true)
                ->orderByDesc('updated_at')
                ->limit(200)
                ->get()
                ->map(fn ($l) => [
                    'id'             => $l->id,
                    'lead_id'        => $l->lead_id,
                    'name'           => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
                    'email'          => $l->email,
                    'phone'          => $l->phone,
                    'country'        => $l->residence_country,
                    'status'         => $l->status,
                    'inz_status'     => $l->inz_status,
                    'inz_visa_type'  => $l->inz_visa_type,
                    'inz_lodged_at'  => $l->inz_lodged_at,
                    'docs_total'     => $l->documents->count(),
                    'docs_approved'  => $l->documents->where('status', 'Approved')->count(),
                    'docs_pending'   => $l->documents->whereIn('status', ['Submitted', 'UnderReview'])->count(),
                    'docs_rejected'  => $l->documents->where('status', 'Rejected')->count(),
                    'updated_at'     => $l->updated_at,
                ]);
            return inertia('portal/immigration/Cases', ['cases' => $cases]);
        } catch (\Throwable $e) {
            Log::error('Immigration cases list failed', ['error' => $e->getMessage()]);
            return inertia('portal/immigration/Cases', ['cases' => []]);
        }
    }

    /**
     * Convert a public ResidentIntake submission into an active immigration
     * case — finds-or-creates a Lead from the intake's contact info, flags
     * it as is_immigration_case, and marks the intake as "Engaged".
     */
    public function convertAssessmentToCase($intakeId)
    {
        try {
            $intake = ResidentIntake::findOrFail($intakeId);

            // Find an existing lead by email; otherwise mint one with the
            // intake data. Intake stays linked via its lead_id (if column
            // exists) or just by email match.
            $lead = Lead::where('email', $intake->email)->first();
            if (! $lead) {
                $lead = Lead::create([
                    'lead_id'    => 'LP-' . str_pad((string) (Lead::max('id') + 1000), 5, '0', STR_PAD_LEFT),
                    'first_name' => $intake->first_name,
                    'last_name'  => $intake->last_name,
                    'email'      => $intake->email,
                    'phone'      => $intake->phone,
                    'source'     => 'resident-intake',
                    'status'     => 'New Leads',
                ]);
            }

            $lead->fill([
                'is_immigration_case'      => true,
                'immigration_converted_at' => now(),
                'immigration_converted_by' => auth()->id(),
            ])->save();

            // Mark the intake as engaged so it falls out of the triage queue.
            $intake->update(['status' => 'Engaged']);

            return redirect("/portal/immigration/leads/{$lead->id}?tab=documents")
                ->with('success', "Converted {$intake->first_name} to an immigration case.");
        } catch (\Throwable $e) {
            Log::error('Assessment to case conversion failed', ['intake_id' => $intakeId, 'error' => $e->getMessage()]);
            return back()->with('error', 'Could not convert this assessment.');
        }
    }

    /** Assessments — public ResidentIntake submissions feed for adviser triage. */
    public function assessments()
    {
        try {
            $intakes = ResidentIntake::latest()->limit(100)->get([
                'id', 'intake_id', 'first_name', 'last_name', 'email', 'phone',
                'current_visa_type', 'job_title', 'status', 'created_at',
            ]);
            return inertia('portal/immigration/Assessments', ['intakes' => $intakes]);
        } catch (\Throwable $e) {
            Log::error('Immigration assessments page failed', ['error' => $e->getMessage()]);
            return inertia('portal/immigration/Assessments', ['intakes' => []]);
        }
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
                    'id'       => $l->id,
                    'lead_id'  => $l->lead_id,
                    'name'     => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
                    'total'    => $l->documents->count(),
                    'approved' => $l->documents->where('status', 'Approved')->count(),
                    'pending'  => $l->documents->whereIn('status', ['Submitted', 'UnderReview'])->count(),
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
            'id'            => $d->id,
            'bucket'        => $bucket,
            'original_name' => $d->original_name,
            'status'        => $d->status,
            'note'          => $d->note,
            'created_at'    => $d->created_at,
            'reviewed_at'   => $d->reviewed_at,
            'checklist_key' => $d->checklist_key,
            'lead' => $d->lead ? [
                'id'      => $d->lead->id,
                'lead_id' => $d->lead->lead_id,
                'name'    => trim("{$d->lead->first_name} {$d->lead->last_name}") ?: 'Unknown',
            ] : null,
        ];
    }

    public function appointments()
    {
        try {
            $rows = Booking::orderByDesc('appointment_date')->limit(100)->get()
                ->map(fn ($b) => [
                    'id'               => $b->id,
                    'name'             => trim("{$b->first_name} {$b->last_name}") ?: 'Unknown',
                    'email'            => $b->email,
                    'service_type'     => $b->service_type,
                    'consultant_name'  => $b->consultant_name,
                    'platform'         => $b->platform,
                    'status'           => $b->status ?: 'Pending',
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
        $period = in_array($request->input('period', 'weekly'), ['weekly','monthly','quarterly','custom'], true)
            ? $request->input('period', 'weekly') : 'weekly';
        return inertia('portal/immigration/Reports', [
            'period' => $period,
            'tiles'  => [
                'active_cases'       => Lead::where('status', 'Visa Process')->count(),
                'new_assessments'    => ResidentIntake::where('created_at', '>=', now()->startOfWeek())->count(),
                'docs_pending'       => LeadDocument::whereIn('status', ['Submitted', 'UnderReview'])->count(),
            ],
            'generated_at' => now()->toIso8601String(),
            'generated_by' => optional(auth()->user())->name,
        ]);
    }

    // Stubs — coming-soon pages.
    public function visaTypes()         { return inertia('portal/immigration/VisaTypes',         []); }
    public function intakes()           { return inertia('portal/immigration/Intakes',           []); }
    public function inzForms()          { return inertia('portal/immigration/InzForms',          []); }
    public function checklistTemplates(){ return inertia('portal/immigration/ChecklistTemplates',[]); }
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
    public function notifications()     { return inertia('portal/immigration/Notifications',     []); }
}
