<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Program;
use App\Traits\BuildsLeadRow;
use App\Traits\CreatesDashboardLead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class EducationController extends Controller
{
    use BuildsLeadRow;
    use CreatesDashboardLead;

    private const LEAD_STATUSES = Lead::STAGES;

    /** Education overview: programs, students (study-plan leads), recent intakes. */
    public function dashboard()
    {
        try {
            $now = now();
            $monthStart = $now->copy()->startOfMonth();

            $programStats = [
                'total' => Program::count(),
                'published' => Program::where('status', 'published')->count(),
                'draft' => Program::where('status', 'draft')->count(),
                'archived' => Program::where('status', 'archived')->count(),
            ];

            $studentStats = [
                'total_with_plan' => Lead::has('studyPlans')->count(),
                'this_month' => Lead::has('studyPlans')->where('created_at', '>=', $monthStart)->count(),
                'qualified' => Lead::has('studyPlans')->whereIn('status', ['Qualified', 'Processing'])->count(),
                'enrolled' => Lead::has('studyPlans')->where('status', 'Closed')->count(),
            ];

            $recentStudents = Lead::with('studyPlans')->has('studyPlans')
                ->latest()->limit(8)->get()->map(function ($l) {
                    return [
                        'id' => $l->id,
                        'lead_id' => $l->lead_id,
                        'name' => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
                        'email' => $l->email,
                        'course' => optional($l->studyPlans->first())->preferred_course,
                        'level' => optional($l->studyPlans->first())->preferred_level,
                        'status' => $l->status ?: 'New',
                        'created_at' => $l->created_at,
                    ];
                });

            $recentPrograms = Program::latest()->limit(6)->get(['id', 'title', 'slug', 'status', 'updated_at']);

            return inertia('portal/education/Dashboard', [
                'programStats' => $programStats,
                'studentStats' => $studentStats,
                'recentStudents' => $recentStudents,
                'recentPrograms' => $recentPrograms,
            ]);
        } catch (\Throwable $e) {
            Log::error('Education dashboard failed', ['error' => $e->getMessage()]);

            return inertia('portal/education/Dashboard', [
                'programStats' => array_fill_keys(['total', 'published', 'draft', 'archived'], 0),
                'studentStats' => array_fill_keys(['total_with_plan', 'this_month', 'qualified', 'enrolled'], 0),
                'recentStudents' => collect(),
                'recentPrograms' => collect(),
            ]);
        }
    }

    /**
     * Leads queue for the Education portal — same shape as Sales so the
     * Leads.jsx page renders identically. No server-side filtering yet;
     * the page's status filter + search lets users narrow to their own
     * department-relevant rows.
     */
    public function leads()
    {
        try {
            $leads = Lead::with([
                'studyPlans',
                'event',
                'portalUser:id,lead_id,last_login_at',
                'notes' => fn ($q) => $q->latest(),
            ])
                ->withCount(['notes', 'documents'])
                ->withCount(['tasks as tasks_open_count' => fn ($q) => $q->where('completed', false)])
                ->latest()->get();

            return inertia('portal/education/Leads', [
                'portal'   => 'education',
                'statuses' => self::LEAD_STATUSES,
                'programs' => Program::orderBy('title')->pluck('title')->filter()->values(),
                'staffOptions' => $this->dashboardStaff(),
                'leads'    => $leads->map(fn ($l) => $this->leadRow($l)),
            ]);
        } catch (\Throwable $e) {
            Log::error('Education leads list failed', ['error' => $e->getMessage()]);

            return inertia('portal/education/Leads', [
                'portal'   => 'education',
                'statuses' => self::LEAD_STATUSES,
                'programs' => Program::orderBy('title')->pluck('title')->filter()->values(),
                'staffOptions' => $this->dashboardStaff(),
                'leads'    => collect(),
            ]);
        }
    }

    /** Manually add a lead from the dashboard "Add Lead" form. */
    public function storeLead(Request $request)
    {
        $validated = $request->validate($this->dashboardLeadRules(self::LEAD_STATUSES));

        try {
            $lead = $this->createDashboardLead($validated);

            return back()->with('success', "Lead {$lead->lead_id} added.");
        } catch (\Throwable $e) {
            Log::error('Education add-lead failed', ['error' => $e->getMessage()]);

            return back()->with('error', 'Could not add that lead. Please try again.');
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
            Log::error('Education lead update failed', ['id' => $id, 'error' => $e->getMessage()]);

            return back()->with('error', 'Could not update that lead. Please try again.');
        }
    }

    /**
     * Students — engaged leads with a study plan or in any post-engagement
     * stage. The Leads page covers prospecting; this is the "in-flight" view.
     */
    public function students()
    {
        try {
            // Students are leads explicitly flipped via "Convert to Student"
            // on the lead detail page. The flag is the source of truth — no
            // more guessing from status or study plans.
            //
            // Returned payload mirrors the Education team's "Students
            // Dashboard" spreadsheet (Date Engaged, Status, Location, Payment,
            // Intake, Program, School, COOP, PTE/IELTS, OOP, Contact, Email,
            // GDrive, Comments) so the expanded student row on the portal
            // matches the columns staff are already tracking offline.
            // Widened to include not just Education students but also leads
            // who have moved on to English (stage = "English Pro") or have
            // been converted to an Immigration case. The frontend segments
            // these into three department tabs (Education / English /
            // Immigration) — once a lead moves on, they drop out of the
            // Education tab automatically.
            $students = Lead::with([
                    'studyPlans',
                    'documents',
                    'school',
                    'studentConverter:id,name',
                    'immigrationConverter:id,name',
                    'stageUpdater:id,name',
                ])
                ->where(function ($q) {
                    $q->where('is_student', true)
                      ->orWhere('is_immigration_case', true)
                      ->orWhere('stage', 'English Pro')
                      ->orWhereNotNull('english_stage')
                      ->orWhereNotNull('immigration_stage');
                })
                ->orderByDesc('student_converted_at')
                ->limit(200)
                ->get()
                ->map(function ($l) {
                    $plan = $l->studyPlans->first();
                    return [
                        'id'       => $l->id,
                        'lead_id'  => $l->lead_id,
                        // Customer-shareable tracking code — drives the
                        // "Copy tracking link" row action so staff can
                        // paste a /track/{code} URL straight to the student.
                        'tracking_code' => $l->tracking_code,
                        // Most recent stage-mover (falls back to whoever
                        // converted them in if the row predates the
                        // stage-update tracking). Drives the
                        // "Updated [date] · Endorsed by [Name]" subtitle
                        // under the stage chip.
                        'endorsed_by'   => optional($l->stageUpdater)->name
                                            ?? optional($l->studentConverter)->name
                                            ?? optional($l->immigrationConverter)->name,
                        'stage_updated_at' => optional($l->stage_updated_at)?->toIso8601String(),
                        'name'     => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
                        'email'    => $l->email,
                        'phone'    => $l->phone,
                        // `education_stage` is the Education-team lifecycle
                        // shown as a dropdown in the Status column; falls
                        // back to the lead's generic status only as a hint.
                        'status'            => $l->education_stage ?: $l->status,
                        'education_stage'   => $l->education_stage,
                        'english_stage'     => $l->english_stage,
                        'immigration_stage' => $l->immigration_stage,
                        // Department-routing flags read by the tab strip.
                        // Drives precedence on the frontend: Immigration >
                        // English > Education.
                        'is_student'          => (bool) $l->is_student,
                        'is_immigration_case' => (bool) $l->is_immigration_case,
                        'stage'               => $l->stage,
                        'location'        => $l->residence_country,
                        'date_engaged' => optional($l->date_of_engagement)->toDateString()
                            ?? optional($l->student_converted_at)->toDateString(),
                        'program'  => optional($plan)->preferred_course,
                        'level'    => optional($plan)->qualification_level,
                        'intake'   => optional($plan)->preferred_intake,
                        'english_test'       => optional($plan)->english_test_type,
                        'english_test_taken' => (bool) optional($plan)->english_test_taken,
                        'english_test_score' => optional($plan)->score_overall,
                        // Spreadsheet-mirror fields stored directly on leads.
                        'middle_name'  => $l->middle_name,
                        'suffix'       => $l->suffix,
                        'gender'       => $l->gender,
                        'payment'      => $l->student_payment,
                        'school'       => $l->student_school,
                        'school_id'    => $l->school_id,
                        'school_name'  => optional($l->school)->name,
                        'coop'         => $l->student_coop,
                        'oop'          => $l->student_oop,
                        'gdrive_link'  => $l->student_gdrive_link,
                        'comments'     => $l->student_comments,
                        'docs_total'    => $l->documents->count(),
                        'docs_approved' => $l->documents->where('status', 'Approved')->count(),
                    ];
                });

            $schoolOptions  = \App\Models\School::where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name', 'country', 'city']);
            $programOptions = \App\Models\Program::orderBy('title')
                ->get(['id', 'title', 'level']);

            return inertia('portal/education/Students', [
                'portal'         => 'education',
                'students'       => $students,
                'schoolOptions'  => $schoolOptions,
                'programOptions' => $programOptions,
            ]);
        } catch (\Throwable $e) {
            Log::error('Education students list failed', ['error' => $e->getMessage()]);
            return inertia('portal/education/Students', ['portal' => 'education', 'students' => collect()]);
        }
    }

    /**
     * Inline-update one of the Students-Dashboard mirror columns from the
     * Students screen's expanded row. The frontend posts a single field at
     * a time; the validator whitelists exactly the dashboard fields so
     * nothing else on the lead can be touched through this endpoint.
     */
    public function updateStudentField(\Illuminate\Http\Request $request, int $id)
    {
        $lead = Lead::where('is_student', true)->findOrFail($id);

        $data = $request->validate([
            'payment'         => 'nullable|string|max:191',
            'school'          => 'nullable|string|max:191',
            'coop'            => 'nullable|string|max:191',
            'oop'             => 'nullable|string|max:191',
            'gdrive_link'     => 'nullable|url|max:512',
            'comments'        => 'nullable|string|max:5000',
            // Department lifecycle stages — each whitelisted to its own
            // canonical list on the Lead model so the columns can't drift
            // to free-form strings.
            'education_stage'   => ['nullable', \Illuminate\Validation\Rule::in(Lead::EDUCATION_STAGES)],
            'english_stage'     => ['nullable', \Illuminate\Validation\Rule::in(Lead::ENGLISH_STAGES)],
            'immigration_stage' => ['nullable', \Illuminate\Validation\Rule::in(Lead::IMMIGRATION_STAGES)],
        ]);

        $map = [
            'payment'           => 'student_payment',
            'school'            => 'student_school',
            'coop'              => 'student_coop',
            'oop'               => 'student_oop',
            'gdrive_link'       => 'student_gdrive_link',
            'comments'          => 'student_comments',
            'education_stage'   => 'education_stage',
            'english_stage'     => 'english_stage',
            'immigration_stage' => 'immigration_stage',
        ];
        // Detect whether the staff member actually moved a stage. Only
        // stage-field changes refresh `stage_updated_at` — touching the
        // spreadsheet columns (payment / coop / oop / etc.) doesn't.
        $stageFields = ['education_stage', 'english_stage', 'immigration_stage'];
        $stageChanged = false;
        foreach ($stageFields as $f) {
            if (array_key_exists($f, $data) && ($lead->{$f} ?? null) !== ($data[$f] ?? null)) {
                $stageChanged = true;
                break;
            }
        }

        foreach ($data as $k => $v) {
            $lead->{$map[$k]} = $v;
        }

        if ($stageChanged) {
            $lead->stage_updated_at = now();
            $lead->stage_updated_by = auth()->id();
        }

        // Auto-promote the lead to an Immigration Case the first time the
        // Education team moves them onto one of the handoff stages
        // (Endorsed to Immigration → Approved Visa). Without this, the
        // student appears in /portal/immigration/cases via the education
        // scope but the lead detail still reads as "Study only" — the
        // Move To widget then doesn't show Immigration as ACTIVE, which is
        // what surprised staff. Conversion is one-way: we don't roll it
        // back when the stage moves to a non-immigration value, since
        // immigration may still be working the case in parallel.
        $movedToImmigrationStage = array_key_exists('education_stage', $data)
            && in_array($data['education_stage'], Lead::EDUCATION_STAGES_IMMIGRATION, true);

        if ($movedToImmigrationStage && ! $lead->is_immigration_case) {
            $lead->is_immigration_case      = true;
            $lead->immigration_converted_at = now();
            $lead->immigration_converted_by = auth()->id();
        }

        // Handoff also retires the student from the Education team's
        // active queue. Without this, the lead-detail "Move To" widget
        // shows both Study and Case as ACTIVE — confusing now that
        // Immigration owns the case. Their record still appears in the
        // Students list (it's joined on is_immigration_case OR is_student),
        // just under the Immigration tab instead of Education's.
        if ($movedToImmigrationStage && $lead->is_student) {
            $lead->is_student = false;
        }

        $lead->save();

        return back();
    }

    /**
     * Create a brand-new student from the Education Students page's
     * "Add new student" modal. Spawns a Lead row pre-flagged with
     * is_student=true so it lands in the Students list immediately,
     * plus a LeadStudyPlan capturing program / intake / English test
     * info if any of those fields were provided.
     */
    public function storeStudent(\Illuminate\Http\Request $request)
    {
        $data = $this->validateStudentPayload($request);

        try {
            $lead = Lead::create([
                'lead_id'              => 'LP-' . str_pad((string) ((int) Lead::max('id') + 1001), 5, '0', STR_PAD_LEFT),
                'first_name'           => $data['first_name'],
                'middle_name'          => $data['middle_name']  ?? null,
                'last_name'            => $data['last_name'],
                'suffix'               => $data['suffix']       ?? null,
                'gender'               => $data['gender']       ?? null,
                'email'                => $data['email']        ?? null,
                'phone'                => $data['phone']        ?? null,
                // First canonical stage if the staff member didn't pick
                // one — the row shows up under "Endorsed to School" with
                // an "Endorsed by [Name]" subtitle in the table, instead
                // of looking unstaged from day one.
                'education_stage'      => $data['education_stage']   ?? Lead::EDUCATION_STAGES[0],
                'english_stage'        => $data['english_stage']     ?? null,
                'immigration_stage'    => $data['immigration_stage'] ?? null,
                'student_payment'      => $data['payment']      ?? null,
                'student_coop'         => $data['coop']         ?? null,
                'student_oop'          => $data['oop']          ?? null,
                'student_comments'     => $data['internal_note'] ?? null,
                'school_id'            => $data['school_id']    ?? null,
                'is_student'           => true,
                'student_converted_at' => now(),
                'student_converted_by' => auth()->id(),
                // Initial stage stamp — the table's "Updated [date] ·
                // Endorsed by [Name]" subtitle uses these columns rather
                // than the generic updated_at.
                'stage_updated_at'     => now(),
                'stage_updated_by'     => auth()->id(),
                'date_of_engagement'   => now()->toDateString(),
            ]);

            if (! empty($data['program_text']) || ! empty($data['intake']) || ! empty($data['english_test'])) {
                // The Program field is a typeable combobox — the user can
                // pick from the catalog OR enter a free-form title. We
                // resolve the typed string to a Program by exact-title
                // match so the qualification_level can be auto-filled.
                $program      = ! empty($data['program_text'])
                    ? \App\Models\Program::where('title', $data['program_text'])->first()
                    : null;
                $programTitle = $data['program_text'] ?? null;
                $programLevel = $program?->level ?? '';

                \App\Models\LeadStudyPlan::create([
                    'lead_id'             => $lead->id,
                    'preferred_course'    => $programTitle,
                    'qualification_level' => $programLevel,
                    'preferred_intake'    => $data['intake']       ?? null,
                    'english_test_type'   => $data['english_test'] ?? null,
                    'english_test_taken'  => false,
                ]);
            }

            return back()->with('success', "Student {$lead->lead_id} added.");
        } catch (\Throwable $e) {
            Log::error('Education store student failed', ['error' => $e->getMessage()]);
            return back()->with('error', 'Could not add the student.');
        }
    }

    /**
     * Update an existing student row from the same modal. Touches the
     * lead's profile fields, school FK, and (if present) the study plan.
     */
    public function updateStudent(\Illuminate\Http\Request $request, int $id)
    {
        $lead = Lead::where('is_student', true)->findOrFail($id);
        $data = $this->validateStudentPayload($request, $lead->id);

        try {
            $lead->fill([
                'first_name'       => $data['first_name'],
                'middle_name'      => $data['middle_name']  ?? null,
                'last_name'        => $data['last_name'],
                'suffix'           => $data['suffix']       ?? null,
                'gender'           => $data['gender']       ?? null,
                'email'            => $data['email']        ?? null,
                'phone'            => $data['phone']        ?? null,
                'education_stage'   => $data['education_stage']   ?? null,
                'english_stage'     => $data['english_stage']     ?? null,
                'immigration_stage' => $data['immigration_stage'] ?? null,
                'student_payment'   => $data['payment']      ?? null,
                'student_coop'     => $data['coop']         ?? null,
                'student_oop'      => $data['oop']          ?? null,
                'student_comments' => $data['internal_note'] ?? null,
                'school_id'        => $data['school_id']    ?? null,
            ])->save();

            // Update or create the primary study plan row.
            $plan = $lead->studyPlans()->first() ?: new \App\Models\LeadStudyPlan(['lead_id' => $lead->id]);
            if (array_key_exists('program_text', $data)) {
                $plan->preferred_course = $data['program_text'] ?: null;
                if (! empty($data['program_text'])) {
                    $match = \App\Models\Program::where('title', $data['program_text'])->first();
                    if ($match && empty($plan->qualification_level)) {
                        $plan->qualification_level = $match->level ?? '';
                    }
                }
                // The legacy column is NOT NULL — give it an empty string
                // on new plans where we couldn't resolve a level.
                if (! $plan->exists && empty($plan->qualification_level)) {
                    $plan->qualification_level = '';
                }
            }
            if (array_key_exists('intake', $data))       $plan->preferred_intake  = $data['intake'] ?: null;
            if (array_key_exists('english_test', $data)) $plan->english_test_type = $data['english_test'] ?: null;
            if ($plan->isDirty() || ! $plan->exists) $plan->save();

            return back()->with('success', "Student {$lead->lead_id} updated.");
        } catch (\Throwable $e) {
            Log::error('Education update student failed', ['id' => $id, 'error' => $e->getMessage()]);
            return back()->with('error', 'Could not update the student.');
        }
    }

    /**
     * Soft-delete a student row by flipping is_student=false. The
     * underlying Lead record stays in place so history, documents, and
     * tasks survive — the row simply drops off the Students table.
     */
    public function destroyStudent(int $id)
    {
        $lead = Lead::where('is_student', true)->findOrFail($id);
        try {
            $lead->fill([
                'is_student'           => false,
                'student_converted_at' => null,
                'student_converted_by' => null,
            ])->save();
            return back()->with('success', "Student {$lead->lead_id} removed from the list.");
        } catch (\Throwable $e) {
            Log::error('Education destroy student failed', ['id' => $id, 'error' => $e->getMessage()]);
            return back()->with('error', 'Could not remove the student.');
        }
    }

    private function validateStudentPayload(\Illuminate\Http\Request $request, ?int $leadId = null): array
    {
        return $request->validate([
            'first_name'       => 'required|string|max:120',
            'middle_name'      => 'nullable|string|max:120',
            'last_name'        => 'required|string|max:120',
            'suffix'           => 'nullable|string|max:20',
            'gender'           => 'nullable|string|max:32',
            'email'            => 'required|email|max:191',
            'phone'            => 'required|string|max:60',
            'education_stage'  => ['nullable', \Illuminate\Validation\Rule::in(Lead::EDUCATION_STAGES)],
            'program_text'     => 'nullable|string|max:191',
            'school_id'        => 'nullable|integer|exists:schools,id',
            'internal_note'    => 'nullable|string|max:5000',
            'payment'          => 'nullable|string|max:191',
            'intake'           => 'nullable|string|max:120',
            'coop'             => 'nullable|string|max:120',
            'oop'              => 'nullable|string|max:120',
            'english_test'     => 'nullable|string|max:32',
        ]);
    }

    /**
     * Documents — Queue view (what needs my attention) + Folders view
     * (every student's folder with completion progress).
     */
    public function documents()
    {
        try {
            $pending = \App\Models\LeadDocument::with('lead:id,first_name,last_name,lead_id')
                ->whereIn('status', ['Submitted', 'UnderReview'])
                ->orderBy('created_at')
                ->limit(50)
                ->get()
                ->map(fn ($d) => $this->docQueueRow($d, 'pending'));

            $stale = \App\Models\LeadDocument::with('lead:id,first_name,last_name,lead_id')
                ->where('status', 'Submitted')
                ->where('created_at', '<', now()->subDays(7))
                ->orderBy('created_at')
                ->limit(30)
                ->get()
                ->map(fn ($d) => $this->docQueueRow($d, 'stale'));

            $rejected = \App\Models\LeadDocument::with('lead:id,first_name,last_name,lead_id')
                ->where('status', 'Rejected')
                ->where('reviewed_at', '>', now()->subDays(14))
                ->orderByDesc('reviewed_at')
                ->limit(30)
                ->get()
                ->map(fn ($d) => $this->docQueueRow($d, 'rejected'));

            // Folders — every lead with at least one document, with progress.
            $folders = Lead::has('documents')
                ->with('documents:id,lead_id,status,checklist_key')
                ->orderBy('first_name')
                ->limit(200)
                ->get()
                ->map(fn ($l) => [
                    'id'       => $l->id,
                    'lead_id'  => $l->lead_id,
                    'name'     => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
                    'total'    => $l->documents->count(),
                    'approved' => $l->documents->where('status', 'Approved')->count(),
                    'pending'  => $l->documents->whereIn('status', ['Submitted', 'UnderReview'])->count(),
                    'rejected' => $l->documents->where('status', 'Rejected')->count(),
                ]);

            return inertia('portal/education/Documents', [
                'portal'   => 'education',
                'pending'  => $pending,
                'stale'    => $stale,
                'rejected' => $rejected,
                'folders'  => $folders,
            ]);
        } catch (\Throwable $e) {
            Log::error('Education documents page failed', ['error' => $e->getMessage()]);
            return inertia('portal/education/Documents', ['portal' => 'education', 'pending' => [], 'stale' => [], 'rejected' => [], 'folders' => []]);
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

    // Stubs — these get real content as we build each feature out.
    public function checklistTemplates(){ return inertia('portal/education/ChecklistTemplates', ['portal' => 'education']); }

    /**
     * Education assessments queue — Free Assessment + Education Enrolment
     * submissions tagged via the `source` column on the leads table. Same
     * page powers Sales; the data is identical, just wrapped with a
     * different portal layout.
     */
    public function assessments()
    {
        return inertia('portal/education/Assessments', [
            'portal'    => 'education',
            'eligibility' => $this->assessmentRows('free-assessment'),
            'enrolment'   => $this->assessmentRows('education-enrolment'),
        ]);
    }

    /**
     * Shared query helper for both Education + Sales assessments pages.
     * Pulls the most recent 200 leads of a given source plus a synthesised
     * `programme` / `level` summary lifted out of the JSON ai_analysis blob.
     */
    private function assessmentRows(string $source)
    {
        return Lead::query()
            ->where('source', $source)
            // Order by updated_at so a draft that was just auto-saved
            // bubbles to the top — created_at would keep it stuck wherever
            // it was first written and make the page feel unchanged after
            // a save.
            ->orderByDesc('updated_at')
            ->limit(200)
            ->get()
            ->map(function (Lead $l) {
                $analysis = is_array($l->ai_analysis) ? $l->ai_analysis : [];
                $sp = $analysis['study_plans'] ?? [];
                return [
                    'id'            => $l->id,
                    'lead_id'       => $l->lead_id,
                    'name'          => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
                    'email'         => $l->email,
                    'phone'         => $l->phone,
                    'country'       => $l->country,
                    'status'        => $l->status,
                    'stage'         => $l->stage,
                    'created_at'    => $l->created_at,
                    'updated_at'    => $l->updated_at,
                    'programme'     => $sp['preferred_course'] ?? null,
                    'level'         => $sp['qualification_level'] ?? null,
                    'intake'        => $sp['preferred_intake'] ?? null,
                    'analysis_done' => $l->ai_analysis_status === 'completed',
                    'detail_url'    => "/portal/education/leads/{$l->id}",
                ];
            });
    }


    /** Programs the Education team advises on — same catalogue admin manages. */
    public function programs()
    {
        try {
            $programs = Program::orderBy('title')->get()->map(fn ($p) => [
                'id'              => $p->id,
                'title'           => $p->title,
                'slug'            => $p->slug,
                'institution'     => $p->institution,
                'location'        => $p->location,
                'level'           => $p->level,
                'category'        => $p->category,
                'status'          => $p->status,
                'duration_months' => $p->duration_months,
                'intake_months'   => $p->intake_months,
                'price_text'      => $p->price_text,
                'enrolled'        => Lead::whereHas('studyPlans', fn ($q) => $q->where('preferred_course', $p->title))->count(),
            ]);

            return inertia('portal/education/Programs', [
                'portal'   => 'education',
                'programs' => $programs,
            ]);
        } catch (\Throwable $e) {
            Log::error('Education programs page failed', ['error' => $e->getMessage()]);
            return inertia('portal/education/Programs', ['portal' => 'education', 'programs' => collect()]);
        }
    }
    /**
     * Single Reports page — period is a query param (weekly / monthly /
     * quarterly / custom). All 13 sections render regardless; only the
     * data underneath changes. Filters (counselor / institution / intake
     * / program) also come in via query so they persist across tab clicks.
     */
    public function reports(Request $request)
    {
        $period = $request->input('period', 'weekly');
        $period = in_array($period, ['weekly', 'monthly', 'quarterly', 'custom'], true) ? $period : 'weekly';

        // Anchor + range per period. Custom takes from/to as ISO dates.
        $now = now();
        switch ($period) {
            case 'monthly':
                $start = $request->filled('anchor') ? \Illuminate\Support\Carbon::parse($request->input('anchor'))->startOfMonth() : $now->copy()->startOfMonth();
                $end   = $start->copy()->endOfMonth();
                $prevStart = $start->copy()->subMonth();
                $prevEnd   = $prevStart->copy()->endOfMonth();
                break;
            case 'quarterly':
                $start = $request->filled('anchor') ? \Illuminate\Support\Carbon::parse($request->input('anchor'))->startOfQuarter() : $now->copy()->startOfQuarter();
                $end   = $start->copy()->endOfQuarter();
                $prevStart = $start->copy()->subQuarter();
                $prevEnd   = $prevStart->copy()->endOfQuarter();
                break;
            case 'custom':
                $start = $request->filled('from') ? \Illuminate\Support\Carbon::parse($request->input('from'))->startOfDay() : $now->copy()->subDays(30)->startOfDay();
                $end   = $request->filled('to')   ? \Illuminate\Support\Carbon::parse($request->input('to'))->endOfDay()    : $now->copy()->endOfDay();
                $prevSpan = $end->diffInDays($start) + 1;
                $prevStart = $start->copy()->subDays($prevSpan);
                $prevEnd   = $start->copy()->subDay()->endOfDay();
                break;
            case 'weekly':
            default:
                $start = $request->filled('anchor') ? \Illuminate\Support\Carbon::parse($request->input('anchor'))->startOfWeek() : $now->copy()->startOfWeek();
                $end   = $start->copy()->endOfWeek();
                $prevStart = $start->copy()->subWeek();
                $prevEnd   = $prevStart->copy()->endOfWeek();
        }

        try {
            // Real-data sections.
            $newStudents  = Lead::where('is_student', true)->whereBetween('student_converted_at', [$start, $end])->count();
            $newStudentsPrev = Lead::where('is_student', true)->whereBetween('student_converted_at', [$prevStart, $prevEnd])->count();

            $totalStudents = Lead::where('is_student', true)->count();

            // Document throughput
            $docsApproved   = \App\Models\LeadDocument::where('status', 'Approved')->whereBetween('reviewed_at', [$start, $end])->count();
            $docsRejected   = \App\Models\LeadDocument::where('status', 'Rejected')->whereBetween('reviewed_at', [$start, $end])->count();
            $docsPending    = \App\Models\LeadDocument::whereIn('status', ['Submitted', 'UnderReview'])->count();
            $docsUploaded   = \App\Models\LeadDocument::whereBetween('created_at', [$start, $end])->count();

            // Programs & institutions — quick snapshot
            $programCount   = \App\Models\Program::count();
            $publishedProgs = \App\Models\Program::where('status', 'published')->count();

            // 8-period trend (weeks / months / quarters / days for custom)
            $trend = $this->buildEducationTrend($period, $start);

            return inertia('portal/education/Reports', [
                'portal'        => 'education',
                'period'        => $period,
                'range'         => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
                'filters'       => $request->only(['counselor', 'institution', 'intake', 'program']),

                'glance' => [
                    'new_students'   => ['value' => $newStudents, 'prev' => $newStudentsPrev],
                    'total_students' => $totalStudents,
                    'docs_approved'  => $docsApproved,
                    'docs_rejected'  => $docsRejected,
                    'docs_pending'   => $docsPending,
                    'docs_uploaded'  => $docsUploaded,
                ],
                'programs' => [
                    'total'     => $programCount,
                    'published' => $publishedProgs,
                ],
                'trend' => $trend,
                'generated_at' => now()->toIso8601String(),
                'generated_by' => optional(auth()->user())->name,
            ]);
        } catch (\Throwable $e) {
            Log::error('Education reports failed', ['error' => $e->getMessage()]);
            return inertia('portal/education/Reports', [
                'portal' => 'education',
                'period' => $period,
                'error'  => 'Could not build the report.',
            ]);
        }
    }

    /** Build a period-appropriate trend array (8 buckets). */
    private function buildEducationTrend(string $period, \Carbon\Carbon $anchor): array
    {
        $points = [];
        for ($i = 7; $i >= 0; $i--) {
            $b = $anchor->copy();
            switch ($period) {
                case 'monthly':
                    $b->subMonths($i);  $start = $b->copy()->startOfMonth();  $end = $b->copy()->endOfMonth();  $label = $b->format('M Y'); break;
                case 'quarterly':
                    $b->subQuarters($i);$start = $b->copy()->startOfQuarter();$end = $b->copy()->endOfQuarter();$label = 'Q' . $b->quarter . ' ' . $b->year; break;
                case 'custom':
                    // For custom, just emit 8 equal slices of the range — best-effort.
                    $start = $anchor->copy()->subDays($i * 7);
                    $end   = $start->copy()->addDays(6);
                    $label = $start->format('d M');
                    break;
                case 'weekly':
                default:
                    $b->subWeeks($i);   $start = $b->copy()->startOfWeek();   $end = $b->copy()->endOfWeek();   $label = $start->format('d M');
            }
            $points[] = [
                'label'        => $label,
                'new_students' => Lead::where('is_student', true)->whereBetween('student_converted_at', [$start, $end])->count(),
                'docs_uploaded'=> \App\Models\LeadDocument::whereBetween('created_at', [$start, $end])->count(),
                'docs_approved'=> \App\Models\LeadDocument::where('status', 'Approved')->whereBetween('reviewed_at', [$start, $end])->count(),
            ];
        }
        return $points;
    }
    public function profile()           { return inertia('portal/education/Profile',  ['portal' => 'education', 'user' => auth()->user()->only(['id','name','email','role'])]); }

    /**
     * Tasks & follow-ups across every lead, bucketed Today / This Week /
     * Overdue / All. Mirrors SalesController::tasks — same data, same
     * serialisation. Rendered via the shared Tasks page (Education portal
     * re-exports the sales component verbatim).
     */
    public function tasks(Request $request)
    {
        try {
            $userId   = $request->user()->id;
            $scope    = $request->input('scope', 'mine');
            $now      = now();
            $todayEnd = $now->copy()->endOfDay();
            $weekEnd  = $now->copy()->endOfWeek();

            $base = \App\Models\LeadTask::with(['lead:id,lead_id,first_name,last_name,email,status', 'assignee:id,name', 'creator:id,name', 'attachments'])
                ->withCount('comments')
                ->when($scope === 'mine', fn ($q) => $q->where('assignee_id', $userId))
                ->when($scope === 'department', fn ($q) => $q->where('department', 'education'));

            $serialize = fn ($t) => [
                'id'           => $t->id,
                'title'        => $t->title,
                'description'  => $t->description,
                'note'         => $t->note,
                'comments_count' => (int) ($t->comments_count ?? 0),
                'priority'     => $t->priority,
                'progress'     => (int) ($t->progress ?? 0),
                'due_at'       => $t->due_at,
                'completed'    => $t->completed,
                'completed_at' => $t->completed_at,
                'overdue'      => ! $t->completed && $t->due_at && $t->due_at->isPast(),
                'type'         => $t->type,
                'category'     => $t->category,
                'department'   => $t->department,
                'tags'         => $t->tags,
                'status'       => $t->status,
                'completion_notes' => $t->completion_notes,
                'attachments'  => $t->attachments->map(fn ($a) => [
                    'id'                => $a->id,
                    'url'               => $a->url,
                    'original_filename' => $a->original_filename,
                    'is_image'          => $a->is_image,
                    'mime_type'         => $a->mime_type,
                    'size'              => $a->size,
                ])->values(),
                'assignee'     => $t->assignee ? ['id' => $t->assignee->id, 'name' => $t->assignee->name] : null,
                'additional_assignee_ids' => $t->additional_assignee_ids ?? [],
                'additional_lead_ids'     => $t->additional_lead_ids ?? [],
                'creator'      => $t->creator ? ['id' => $t->creator->id, 'name' => $t->creator->name] : null,
                'lead'         => $t->lead ? [
                    'id'      => $t->lead->id,
                    'lead_id' => $t->lead->lead_id,
                    'name'    => trim("{$t->lead->first_name} {$t->lead->last_name}"),
                    'status'  => $t->lead->status,
                ] : null,
            ];

            // Full task set for the kanban (all dates, all statuses) — the
            // bucket queries below are kept for the legacy list view.
            $allTasks     = (clone $base)->orderByDesc('created_at')->limit(1000)->get()->map($serialize);
            $today        = (clone $base)->where('completed', false)->whereBetween('due_at', [$now, $todayEnd])->orderBy('due_at')->get()->map($serialize);
            $overdue      = (clone $base)->where('completed', false)->whereNotNull('due_at')->where('due_at', '<', $now)->orderBy('due_at')->get()->map($serialize);
            $thisWeek     = (clone $base)->where('completed', false)->whereBetween('due_at', [$todayEnd, $weekEnd])->orderBy('due_at')->get()->map($serialize);
            $undated      = (clone $base)->where('completed', false)->whereNull('due_at')->orderByDesc('created_at')->limit(50)->get()->map($serialize);
            $recentlyDone = (clone $base)->where('completed', true)->orderByDesc('completed_at')->limit(20)->get()->map($serialize);

            return inertia('portal/education/Tasks', [
                'portal'        => 'education',
                'scope'         => $scope,
                'all_tasks'     => $allTasks,
                'today'         => $today,
                'overdue'       => $overdue,
                'this_week'     => $thisWeek,
                'undated'       => $undated,
                'recently_done' => $recentlyDone,
                'staffOptions'  => \App\Models\User::whereNotIn('role', ['lead', 'revoked_lead'])->orderBy('name')->get(['id', 'name', 'role']),
                'recent_activity' => \App\Models\ActivityLog::where('action', 'like', 'lead_task.%')
                    ->latest()->limit(30)
                    ->get(['id', 'action', 'description', 'actor_name', 'actor_role', 'properties', 'created_at']),
            ]);
        } catch (\Throwable $e) {
            Log::error('Education tasks page failed', ['error' => $e->getMessage()]);
            return inertia('portal/education/Tasks', ['portal' => 'education', 'scope' => 'mine', 'today' => [], 'overdue' => [], 'this_week' => [], 'undated' => [], 'recently_done' => [], 'staffOptions' => []]);
        }
    }
}
