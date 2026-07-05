<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\EnglishAssessment;
use App\Models\EnglishClass;
use App\Models\EnglishClassEnrollment;
use App\Models\Lead;
use App\Models\LeadStudyPlan;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class EnglishController extends Controller
{
    /**
     * English overview. No dedicated English-language tables yet, so we
     * surface IELTS/PTE-flagged study plans as the proxy "learners" cohort.
     */
    public function dashboard()
    {
        try {
            $now = now();
            $monthStart = $now->copy()->startOfMonth();

            $learnerStats = [
                'total' => LeadStudyPlan::where('english_test_taken', true)->count(),
                'this_month' => LeadStudyPlan::where('english_test_taken', true)
                    ->where('created_at', '>=', $monthStart)->count(),
                'ielts' => LeadStudyPlan::where('english_test_type', 'IELTS')->count(),
                'pte' => LeadStudyPlan::where('english_test_type', 'PTE')->count(),
            ];

            $recentLearners = LeadStudyPlan::with('lead')
                ->where('english_test_taken', true)
                ->latest()
                ->limit(8)
                ->get()
                ->map(function ($sp) {
                    $lead = $sp->lead;

                    return [
                        'id' => $sp->id,
                        'lead_id' => optional($lead)->lead_id,
                        'name' => $lead ? trim("{$lead->first_name} {$lead->last_name}") : 'Unknown',
                        'email' => optional($lead)->email,
                        'test_type' => $sp->english_test_type,
                        'test_score' => $sp->score_overall,
                        'test_date' => $sp->english_test_date,
                        'created_at' => $sp->created_at,
                    ];
                });

            return inertia('portal/english/Dashboard', [
                'learnerStats' => $learnerStats,
                'recentLearners' => $recentLearners,
            ]);
        } catch (\Throwable $e) {
            Log::error('English dashboard failed', ['error' => $e->getMessage()]);

            return inertia('portal/english/Dashboard', [
                'learnerStats' => array_fill_keys(['total', 'this_month', 'ielts', 'pte'], 0),
                'recentLearners' => collect(),
            ]);
        }
    }

    /**
     * Learners list — every lead flagged is_english_student. Supports a
     * stage filter (Lead::ENGLISH_STAGES) and a free-text search across
     * name / email / phone / lead_id. Paginated server-side.
     */
    public function learners(Request $request)
    {
        $stage  = $request->query('stage');
        $search = trim((string) $request->query('search', ''));

        $learners = Lead::query()
            ->where('is_english_student', true)
            ->when($stage, fn ($q) => $q->where('english_stage', $stage))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('lead_id', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('english_converted_at')
            ->orderByDesc('updated_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Lead $l) => [
                'id'            => $l->id,
                'lead_id'       => $l->lead_id,
                'name'          => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
                'email'         => $l->email,
                'phone'         => $l->phone,
                'english_stage' => $l->english_stage,
                'converted_at'  => optional($l->english_converted_at)?->toIso8601String(),
                'last_activity' => optional($l->updated_at)?->toIso8601String(),
            ]);

        return inertia('portal/english/Learners', [
            'portal'   => 'english',
            'learners' => $learners,
            'stages'   => Lead::ENGLISH_STAGES,
            'filters'  => ['stage' => $stage, 'search' => $search],
        ]);
    }

    // ─── Classes ──────────────────────────────────────────────────────────

    /**
     * Class list. Enrollments are embedded per class so the detail modal
     * has everything client-side (class counts are small). Supports a
     * status filter.
     */
    public function classes(Request $request, $focusId = null)
    {
        $status = $request->query('status');

        $classes = EnglishClass::query()
            ->with([
                'instructor:id,name',
                'enrollments.lead:id,first_name,last_name,email,lead_id',
            ])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->orderByDesc('starts_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (EnglishClass $c) => $this->serializeClass($c));

        return inertia('portal/english/Classes', [
            'portal'            => 'english',
            'classes'           => $classes,
            'statuses'          => EnglishClass::STATUSES,
            'instructorOptions' => $this->instructorOptions(),
            'learnerOptions'    => $this->learnerOptions(),
            'filters'           => ['status' => $status],
            'focusClassId'      => $focusId ? (int) $focusId : null,
        ]);
    }

    public function showClass(Request $request, $id)
    {
        // Deep-link to a single class — renders the list with that class's
        // detail modal opened.
        return $this->classes($request, $id);
    }

    public function storeClass(Request $request)
    {
        $data = $this->validateClass($request);
        $class = EnglishClass::create($data);

        return back()->with('success', "Class \"{$class->name}\" created.");
    }

    public function updateClass(Request $request, $id)
    {
        $class = EnglishClass::findOrFail($id);
        $class->update($this->validateClass($request));

        return back()->with('success', "Class \"{$class->name}\" updated.");
    }

    public function destroyClass($id)
    {
        $class = EnglishClass::findOrFail($id);
        $class->delete(); // soft delete

        return back()->with('success', 'Class removed.');
    }

    public function enrollLearner(Request $request, $id)
    {
        $class = EnglishClass::findOrFail($id);

        $data = $request->validate([
            // The lead must exist AND be flagged is_english_student.
            'lead_id' => [
                'required',
                Rule::exists('leads', 'id')->where(fn ($q) => $q->where('is_english_student', true)),
            ],
            'notes' => 'nullable|string|max:1000',
        ], [
            'lead_id.exists' => 'That learner is not an English student.',
        ]);

        EnglishClassEnrollment::firstOrCreate(
            ['english_class_id' => $class->id, 'lead_id' => $data['lead_id']],
            ['status' => 'active', 'enrolled_at' => now(), 'notes' => $data['notes'] ?? null],
        );

        return back()->with('success', 'Learner enrolled.');
    }

    public function withdrawLearner($id, $enrollmentId)
    {
        $enrollment = EnglishClassEnrollment::where('english_class_id', $id)
            ->findOrFail($enrollmentId);
        $enrollment->delete();

        return back()->with('success', 'Learner withdrawn from class.');
    }

    private function validateClass(Request $request): array
    {
        return $request->validate([
            'name'          => 'required|string|max:191',
            'description'   => 'nullable|string|max:5000',
            'instructor_id' => 'nullable|exists:users,id',
            'schedule_text' => 'nullable|string|max:191',
            'location'      => 'nullable|string|max:1000',
            'capacity'      => 'nullable|integer|min:0|max:1000',
            'status'        => ['required', Rule::in(EnglishClass::STATUSES)],
            'starts_at'     => 'nullable|date',
            'ends_at'       => 'nullable|date|after_or_equal:starts_at',
        ]);
    }

    private function serializeClass(EnglishClass $c): array
    {
        return [
            'id'             => $c->id,
            'name'           => $c->name,
            'description'    => $c->description,
            'instructor_id'  => $c->instructor_id,
            'instructor'     => optional($c->instructor)->name,
            'schedule_text'  => $c->schedule_text,
            'location'       => $c->location,
            'capacity'       => $c->capacity,
            'status'         => $c->status,
            'starts_at'      => optional($c->starts_at)?->toDateString(),
            'ends_at'        => optional($c->ends_at)?->toDateString(),
            'enrolled_count' => $c->enrollments->count(),
            'enrollments'    => $c->enrollments->map(fn (EnglishClassEnrollment $e) => [
                'id'          => $e->id,
                'lead_id'     => $e->lead_id,
                'name'        => $e->lead ? trim("{$e->lead->first_name} {$e->lead->last_name}") : 'Unknown',
                'email'       => optional($e->lead)->email,
                'status'      => $e->status,
                'enrolled_at' => optional($e->enrolled_at)?->toIso8601String(),
            ])->values(),
        ];
    }

    /** Users who can be assigned as instructors (English staff + admins). */
    private function instructorOptions()
    {
        return User::query()
            ->whereIn('role', ['english', 'admin', 'super_admin'])
            ->orderBy('name')
            ->get(['id', 'name', 'role', 'avatar_path']);
    }

    /** English learners available to enroll / record assessments against. */
    private function learnerOptions()
    {
        return Lead::query()
            ->where('is_english_student', true)
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'email', 'lead_id'])
            ->map(fn (Lead $l) => [
                'id'      => $l->id,
                'lead_id' => $l->lead_id,
                'name'    => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
                'email'   => $l->email,
            ]);
    }

    // ─── Assessments ──────────────────────────────────────────────────────

    /**
     * Assessment list with type / date-range / learner-search filters and
     * top-line stats (this month, average overall score, pass rate).
     */
    public function assessments(Request $request)
    {
        $type     = $request->query('type');
        $dateFrom = $request->query('date_from');
        $dateTo   = $request->query('date_to');
        $search   = trim((string) $request->query('search', ''));

        $base = EnglishAssessment::query()
            ->with(['lead:id,first_name,last_name,email,lead_id', 'englishClass:id,name', 'administrator:id,name'])
            ->when($type, fn ($q) => $q->where('assessment_type', $type))
            ->when($dateFrom, fn ($q) => $q->whereDate('assessment_date', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->whereDate('assessment_date', '<=', $dateTo))
            ->when($search !== '', fn ($q) => $q->whereHas('lead', function ($qq) use ($search) {
                $qq->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            }));

        $assessments = (clone $base)
            ->orderByDesc('assessment_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn (EnglishAssessment $a) => $this->serializeAssessment($a));

        // Stats are computed across the *unfiltered* dataset so the header
        // reflects the whole programme, not the current filter view.
        $all = EnglishAssessment::query();
        $stats = [
            'this_month'   => (clone $all)->whereDate('assessment_date', '>=', now()->startOfMonth())->count(),
            'average_score' => round((float) (clone $all)->whereNotNull('overall_score')->avg('overall_score'), 1),
            'pass_rate'    => $this->passRate(),
            'total'        => (clone $all)->count(),
        ];

        return inertia('portal/english/Assessments', [
            'portal'         => 'english',
            'assessments'    => $assessments,
            'stats'          => $stats,
            'types'          => EnglishAssessment::TYPES,
            'learnerOptions' => $this->learnerOptions(),
            'classOptions'   => EnglishClass::orderByDesc('created_at')->get(['id', 'name']),
            'filters'        => ['type' => $type, 'date_from' => $dateFrom, 'date_to' => $dateTo, 'search' => $search],
        ]);
    }

    public function showAssessment($id)
    {
        $a = EnglishAssessment::with(['lead:id,first_name,last_name,email,lead_id', 'englishClass:id,name', 'administrator:id,name'])
            ->findOrFail($id);

        return response()->json(['assessment' => $this->serializeAssessment($a)]);
    }

    public function storeAssessment(Request $request)
    {
        $data = $this->validateAssessment($request);
        $data['administered_by'] = $data['administered_by'] ?? auth()->id();
        EnglishAssessment::create($data);

        return back()->with('success', 'Assessment recorded.');
    }

    public function updateAssessment(Request $request, $id)
    {
        $assessment = EnglishAssessment::findOrFail($id);
        $assessment->update($this->validateAssessment($request));

        return back()->with('success', 'Assessment updated.');
    }

    public function destroyAssessment($id)
    {
        EnglishAssessment::findOrFail($id)->delete(); // soft delete

        return back()->with('success', 'Assessment removed.');
    }

    private function validateAssessment(Request $request): array
    {
        // PTE-style scores run 0–90; "other" (e.g. IELTS) runs 0–9.
        $max = $request->input('assessment_type') === 'other' ? 9 : 90;
        $score = "nullable|numeric|min:0|max:{$max}";

        return $request->validate([
            'lead_id' => [
                'required',
                Rule::exists('leads', 'id')->where(fn ($q) => $q->where('is_english_student', true)),
            ],
            'english_class_id' => 'nullable|exists:english_classes,id',
            'assessment_type'  => ['required', Rule::in(EnglishAssessment::TYPES)],
            'assessment_date'  => 'required|date',
            'overall_score'    => $score,
            'reading_score'    => $score,
            'writing_score'    => $score,
            'listening_score'  => $score,
            'speaking_score'   => $score,
            'passed'           => 'nullable|boolean',
            'notes'            => 'nullable|string|max:5000',
            'administered_by'  => 'nullable|exists:users,id',
        ], [
            'lead_id.exists' => 'That learner is not an English student.',
        ]);
    }

    private function passRate(): ?float
    {
        $graded = EnglishAssessment::whereNotNull('passed')->count();
        if ($graded === 0) {
            return null;
        }
        $passed = EnglishAssessment::where('passed', true)->count();

        return round($passed / $graded * 100, 1);
    }

    private function serializeAssessment(EnglishAssessment $a): array
    {
        return [
            'id'               => $a->id,
            'lead_id'          => $a->lead_id,
            'learner'          => $a->lead ? trim("{$a->lead->first_name} {$a->lead->last_name}") : 'Unknown',
            'email'            => optional($a->lead)->email,
            'english_class_id' => $a->english_class_id,
            'class_name'       => optional($a->englishClass)->name,
            'assessment_type'  => $a->assessment_type,
            'assessment_date'  => optional($a->assessment_date)?->toDateString(),
            'overall_score'    => $a->overall_score,
            'reading_score'    => $a->reading_score,
            'writing_score'    => $a->writing_score,
            'listening_score'  => $a->listening_score,
            'speaking_score'   => $a->speaking_score,
            'passed'           => $a->passed,
            'notes'            => $a->notes,
            'administered_by'  => optional($a->administrator)->name,
        ];
    }
}
