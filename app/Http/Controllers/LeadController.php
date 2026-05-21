<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Http\Requests\StoreLeadRequest;
use App\Jobs\AnalyzeLeadAssessment;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LeadController extends Controller
{
    /**
     * Display a listing of the leads.
     */
    public function index()
    {
        $leads = Lead::with(['studyPlans', 'event'])->latest()->get();
        return inertia('admin/Leads', [
            'leads' => $leads
        ]);
    }

    /**
     * Store a newly created complex Lead in storage securely.
     */
    public function store(StoreLeadRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            
            // 1. Create Base Lead
            $leadData = $request->except(['education', 'study_plans']);
            
            // Generate a temporary unique LP identifier if none provided
            if (!isset($leadData['lead_id'])) {
                $leadData['lead_id'] = 'LP-' . rand(10000, 99999);
            }
            
            $lead = Lead::create($leadData);
            
            // 2. Attach Education Experiences safely
            if ($request->has('education')) {
                foreach ($request->input('education') as $edu) {
                    $lead->educationExps()->create($edu);
                }
            }
            
            // 3. Attach Study Plans safely
            if ($request->has('study_plans')) {
                foreach ($request->input('study_plans') as $plan) {
                    $lead->studyPlans()->create($plan);
                }
            }
            
            DB::commit();
            
            return response()->json([
                'status' => 'success',
                'message' => 'Lead successfully ingested with related arrays.',
                'data' => $lead->load(['educationExps', 'studyPlans'])
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Lead storage failed', ['error' => $e->getMessage()]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create lead due to server error.'
            ], 500);
        }
    }


    /**
     * Show the Free Assessment form.
     */
    public function showFreeAssessment()
    {
        return inertia('free-assessment/FreeAssessmentPage');
    }

    /**
     * Store a free assessment submission.
     */
    public function storeFreeAssessment(\Illuminate\Http\Request $request)
    {
        // 1. Comprehensive Validation - mirrors the frontend per-step contract.
        //    Field names match the keys the React form uses so onError can
        //    map each error back to the correct step.
        $validated = $request->validate([
            // Step 1 - Terms
            'terms_accepted' => 'required|accepted',

            // Step 2 - Personal
            'first_name'        => 'required|string|max:255',
            'last_name'         => 'required|string|max:255',
            'email'             => 'required|email|max:255',
            'phone'             => 'required|string|max:25',
            'gender'            => 'required|string|max:50',
            'dob'               => 'required|date',
            'country_of_birth'  => 'required|string|max:120',
            'citizenship'       => 'required|string|max:120',
            'residence_country' => 'required|string|max:120',
            'has_other_names'   => 'nullable|in:Yes,No',
            'other_names'       => 'nullable|required_if:has_other_names,Yes|string|max:255',
            'has_passport'      => 'nullable|in:Yes,No',
            'passport_number'   => 'nullable|required_if:has_passport,Yes|string|max:60',
            'passport_expiry'   => 'nullable|required_if:has_passport,Yes|date',
            'passport_pdf'      => 'nullable|file|mimes:pdf|max:10240',

            // Step 3 - Study Plans
            'study_plans'                       => 'nullable|array',
            'study_plans.preferred_course'      => 'required|string|max:255',
            'study_plans.qualification_level'   => 'required|string|max:120',
            'study_plans.has_english_test'      => 'nullable|in:Yes,No',
            'study_plans.english_test_type'     => 'nullable|required_if:study_plans.has_english_test,Yes|string|max:120',
            'study_plans.test_score_overall'    => 'nullable|required_if:study_plans.has_english_test,Yes|string|max:20',

            // Step 4 - Education
            'education_background' => 'nullable|array',
            'has_gap'              => 'nullable|in:Yes,No',
            'gap_length'           => 'nullable|required_if:has_gap,Yes|string|max:120',
            'gap_activities'       => 'nullable|required_if:has_gap,Yes|array|min:1',

            // Step 5 - Work
            'work_experience'                 => 'required|array|min:1',
            'work_experience.0.company_name'  => 'required|string|max:255',
            'work_experience.0.job_title'     => 'required|string|max:255',

            // Step 6 - Financial
            'financial_info'                    => 'required|array',
            'financial_info.funding_source'     => 'required|array|min:1',
            'financial_info.estimated_budget'   => 'required|string|max:120',
            'financial_info.has_sponsors'       => 'nullable|in:Yes,No',
            'financial_info.sponsor_relation'   => 'nullable|required_if:financial_info.has_sponsors,Yes|string|max:120',

            // Step 7 - Source of funds
            'source_of_funds_info'                          => 'required|array',
            'source_of_funds_info.sources'                  => 'required|array|min:1',
            'source_of_funds_info.will_use_sponsor'         => 'nullable|in:Yes,No',
            'source_of_funds_info.sponsor_relation'         => 'nullable|required_if:source_of_funds_info.will_use_sponsor,Yes|string|max:120',
            'source_of_funds_info.sponsor_occupation'       => 'nullable|required_if:source_of_funds_info.will_use_sponsor,Yes|string|max:120',
            'source_of_funds_info.sponsor_annual_income'    => 'nullable|required_if:source_of_funds_info.will_use_sponsor,Yes|string|max:120',

            // Step 8 - Immigration
            'immigration_info'                              => 'required|array',
            'immigration_info.submission_country'           => 'required|string|max:120',
            'immigration_info.has_travelled_overseas'       => 'nullable|in:Yes,No',
            'immigration_info.overseas_travel_details'      => 'nullable|required_if:immigration_info.has_travelled_overseas,Yes|string',
            'immigration_info.has_applied_nz_visa'          => 'nullable|in:Yes,No',
            'immigration_info.nz_visa_details'              => 'nullable|required_if:immigration_info.has_applied_nz_visa,Yes|string',
            'immigration_info.has_applied_other_visa'       => 'nullable|in:Yes,No',
            'immigration_info.other_visa_details'           => 'nullable|required_if:immigration_info.has_applied_other_visa,Yes|string',
            'immigration_info.has_visa_refusal'             => 'nullable|in:Yes,No',
            'immigration_info.visa_refusal_details'         => 'nullable|required_if:immigration_info.has_visa_refusal,Yes|string',

            // Step 9 - Character / Health (optional structure)
            'character_info' => 'nullable|array',
            'health_info'    => 'nullable|array',

            // Step 10 - Family
            'family_info' => 'nullable|array',

            // Step 11 - Additional
            'nz_contacts_info'                          => 'nullable|array',
            'nz_contacts_info.has_nz_contacts'          => 'nullable|in:Yes,No',
            'nz_contacts_info.contact_first_name'       => 'nullable|required_if:nz_contacts_info.has_nz_contacts,Yes|string|max:120',
            'nz_contacts_info.contact_family_name'      => 'nullable|required_if:nz_contacts_info.has_nz_contacts,Yes|string|max:120',
            'military_info'  => 'nullable|array',
            'home_ties_info' => 'nullable|array',

            // Step 12 - Declaration
            'declaration_accepted' => 'required|accepted',
        ]);

        try {
            DB::beginTransaction();

            $data = $request->all();

            // 2. Handle Passport Upload Securely
            $passportPath = $request->hasFile('passport_pdf')
                ? $request->file('passport_pdf')->store('passports', 'public')
                : null;

            // 3. Dedup-by-email: if this person already exists, enrich the
            // existing record instead of creating a duplicate FA-... row.
            // The intake service records a `lead.resubmitted` activity entry
            // so the History tab shows the new touchpoint.
            $intake = app(\App\Services\LeadIntakeService::class);
            $existing = $intake->ingest('free-assessment', [
                'first_name' => $validated['first_name'],
                'last_name'  => $validated['last_name'],
                'email'      => $validated['email'],
                'phone'      => $validated['phone'] ?? null,
                'country'    => $data['residence_country'] ?? null,
            ], $request);

            // Was this an existing lead? Yes if its lead_id doesn't already
            // start with FA- — in that case keep the original lead_id so
            // historical references (assessment-result URL, ai_analysis)
            // stay stable.
            $payload = [
                'lead_id'           => str_starts_with((string) $existing->lead_id, 'FA-')
                    ? $existing->lead_id
                    : 'FA-' . strtoupper(uniqid()),
                'first_name'        => $validated['first_name'],
                'last_name'         => $validated['last_name'],
                'email'             => $validated['email'],
                'phone'             => $validated['phone'] ?? null,
                'dob'               => $data['dob'] ?? null,
                'other_names'       => $data['other_names'] ?? null,
                'gender'            => $data['gender'] ?? null,
                'marital_status'    => $data['marital_status'] ?? null,
                'terms_accepted'    => $request->boolean('terms_accepted'),
                
                // Residency
                'country_of_birth'  => $data['country_of_birth'] ?? null,
                'place_of_birth'    => $data['place_of_birth'] ?? null,
                'citizenship'       => $data['citizenship'] ?? null,
                'residence_city'    => $data['residence_city'] ?? null,
                'residence_state'   => $data['residence_state'] ?? null,
                'residence_country' => $data['residence_country'] ?? null,

                // Passport
                'has_passport'      => $data['has_passport'] ?? 'No',
                'passport_number'   => $data['passport_number'] ?? null,
                'passport_expiry'   => $data['passport_expiry'] ?? null,
                'passport_path'     => $passportPath,

                // JSON/Text Info
                'financial_info'    => $data['financial_info'] ?? null,
                'work_info'         => $data['work_experience'] ?? null,
                'gap_explanation'   => $data['gap_explanation'] ?? null,
                'education_notes'   => [
                    'high_school_completed' => $data['high_school_completed'] ?? 'No',
                    'high_school_level'     => $data['high_school_level'] ?? null,
                    'high_school_institution' => $data['high_school_institution'] ?? null,
                    'high_school_start'     => $data['high_school_start'] ?? null,
                    'high_school_end'       => $data['high_school_end'] ?? null,
                    'high_school_marks'     => $data['high_school_marks'] ?? null,
                    'education_docs'        => $data['education_docs'] ?? [],
                    'has_gap'               => $data['has_gap'] ?? 'No',
                    'gap_length'            => $data['gap_length'] ?? null,
                    'gap_activities'        => $data['gap_activities'] ?? [],
                ],

                // New assessment sections
                'immigration_info'      => $data['immigration_info'] ?? null,
                'character_info'        => $data['character_info'] ?? null,
                'health_info'           => $data['health_info'] ?? null,
                'family_info'           => $data['family_info'] ?? null,
                'nz_contacts_info'      => $data['nz_contacts_info'] ?? null,
                'military_info'         => $data['military_info'] ?? null,
                'source_of_funds_info'  => $data['source_of_funds_info'] ?? null,
                'home_ties_info'        => $data['home_ties_info'] ?? null,
                'declaration_accepted'  => $request->boolean('declaration_accepted'),

                'status' => 'New',
                'stage'  => 'Evaluation',
                'source' => 'free-assessment',
            ];

            // Update the existing lead with the full assessment payload —
            // assessment is our richest form so its fields take precedence
            // over any earlier partial submissions.
            $existing->update($payload);
            $lead = $existing->fresh();

            // 4. Relational Data Mapping: Study Plans
            if (!empty($data['study_plans'])) {
                $plans = $data['study_plans'];
                $lead->studyPlans()->create([
                    'preferred_course'    => $plans['preferred_course'] ?? null,
                    'qualification_level' => $plans['qualification_level'] ?? null,
                    'preferred_city'      => $plans['preferred_city'] ?? null,
                    'preferred_intake'    => $plans['preferred_intake'] ?? null,
                    'english_test_taken'  => ($plans['has_english_test'] ?? 'No') === 'Yes',
                    'english_test_type'   => $plans['english_test_type'] ?? null,
                    'score_overall'       => $plans['test_score_overall'] ?? null,
                    'score_reading'       => $plans['test_score_reading'] ?? null,
                    'score_writing'       => $plans['test_score_writing'] ?? null,
                    'score_listening'     => $plans['test_score_listening'] ?? null,
                    'score_speaking'      => $plans['test_score_speaking'] ?? null,
                    'english_test_date'   => $plans['test_date'] ?? null,
                ]);
            }

            // 5. Relational Data Mapping: Education Background (only completed entries)
            if (!empty($data['education_background'])) {
                foreach ($data['education_background'] as $edu) {
                    if (empty($edu['completed'])) {
                        continue;
                    }
                    $lead->educationExps()->create([
                        'level'         => $edu['level'] ?? null,
                        'field_of_study' => $edu['field_of_study'] ?? null,
                        'institution'   => $edu['institution'] ?? null,
                        'start_date'    => $edu['start_date'] ?? null,
                        'end_date'      => $edu['end_date'] ?? null,
                        'average_marks' => $edu['marks_percentage'] ?? null,
                    ]);
                }
            }

            DB::commit();

            AnalyzeLeadAssessment::dispatch($lead);

            return redirect()->back()->with([
                'success' => 'Your assessment profile has been securely submitted.',
                'lead_id' => $lead->lead_id,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Free assessment mapping failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            $message = app()->environment('production')
                ? 'Submission failed due to a server error. Our team has been notified.'
                : 'Submission failed: ' . $e->getMessage();
            return redirect()->back()->withErrors(['error' => $message])->withInput();
        }
    }

    /**
     * Display the public assessment result for a client.
     */
    public function showAssessmentResult($leadId)
    {
        $lead = Lead::where('lead_id', $leadId)->firstOrFail();

        return inertia('free-assessment/AssessmentResult', [
            'lead_id' => $lead->lead_id,
            'first_name' => $lead->first_name,
            'status' => $lead->ai_analysis_status,
            'analysis' => $lead->ai_analysis_status === 'completed' ? $lead->ai_analysis : null,
        ]);
    }

    /**
     * Display the specified lead.
     */
    public function show($id)
    {
        $lead = Lead::where('id', $id)
            ->orWhere('lead_id', $id)
            ->with(['studyPlans', 'educationExps', 'event', 'tags'])
            ->firstOrFail();

        // History — every Lead update logged by the LogsActivity trait,
        // surfaced on the "History" tab. We show all changes (stage, stage,
        // any field edit) so the audit trail is complete.
        $history = \App\Models\ActivityLog::where('properties->subject_type', 'Lead')
            ->where('properties->subject_id', $lead->id)
            ->latest()
            ->limit(80)
            ->get()
            ->map(fn ($log) => [
                'id'          => $log->id,
                'action'      => $log->action,
                'description' => $log->description,
                'actor_name'  => $log->actor_name ?: 'System',
                'actor_role'  => $log->actor_role ?: 'public',
                'changes'     => data_get($log->properties, 'changes'),
                'created_at'  => $log->created_at,
            ]);

        // Render under the correct portal chrome based on which URL prefix
        // the request came through. /portal/sales/leads/{id} → SalesLayout,
        // /portal/education/leads/{id} → EducationLayout, etc. Falls back
        // to AdminLayout when hit via /admin/leads/{id}.
        //
        // Each non-admin path has a thin re-export at portal/{role}/LeadDetails
        // that simply re-exports admin/LeadDetails — same component, role's
        // layout (because app.jsx picks the layout from the page-name prefix).
        $path = request()->path(); // e.g. "portal/sales/leads/23"
        $page = 'admin/LeadDetails';
        foreach (['sales', 'education', 'english', 'immigration', 'accommodation'] as $role) {
            str_starts_with($path, "portal/{$role}/") ? $page = "portal/{$role}/LeadDetails" : null;
        }

        // Internal staff notes — pinned first, then newest.
        $notes = \App\Models\LeadNote::where('lead_id', $lead->id)
            ->orderByDesc('pinned')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($n) => [
                'id'          => $n->id,
                'body'        => $n->body,
                'author_name' => $n->author_name ?: 'Unknown',
                'author_role' => $n->author_role ?: 'staff',
                'user_id'     => $n->user_id,
                'pinned'      => $n->pinned,
                'created_at'  => $n->created_at,
                'updated_at'  => $n->updated_at,
            ]);

        // Tags attached to this lead + a hint list of every tag in the
        // system (for the autocomplete chip in the UI).
        $leadTags = $lead->tags->map(fn ($t) => [
            'id' => $t->id, 'name' => $t->name, 'color' => $t->color,
        ]);
        $allTags = \App\Models\LeadTag::orderBy('name')->limit(50)->get(['id', 'name', 'color']);

        // Tasks — open first (sorted by due date), then completed.
        $tasks = \App\Models\LeadTask::with(['assignee:id,name', 'creator:id,name'])
            ->where('lead_id', $lead->id)
            ->orderBy('completed')
            ->orderByRaw('due_at IS NULL, due_at ASC')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($t) => [
                'id'           => $t->id,
                'title'        => $t->title,
                'description'  => $t->description,
                'due_at'       => $t->due_at,
                'priority'     => $t->priority,
                'completed'    => $t->completed,
                'completed_at' => $t->completed_at,
                'overdue'      => ! $t->completed && $t->due_at && $t->due_at->isPast(),
                'assignee'     => $t->assignee ? ['id' => $t->assignee->id, 'name' => $t->assignee->name] : null,
                'created_by'   => $t->created_by,
                'creator'      => $t->creator ? ['id' => $t->creator->id, 'name' => $t->creator->name] : null,
            ]);

        // Staff users available as task assignees (small list — could later
        // be filtered by role).
        $staffOptions = \App\Models\User::whereNotIn('role', ['lead', 'revoked_lead'])
            ->orderBy('name')
            ->get(['id', 'name', 'role']);

        // Unified Activity log — every source touchpoint AND every field/
        // stage update merged into one chronological feed. Replaces the
        // separate History tab + Sources panel.
        $activity = $this->buildActivityFeed($lead, $history);

        // Stage timeline — distinct entries per pipeline stage the lead has
        // moved through, with entered/exited timestamps for the Journey panel.
        $stageTimeline = $this->buildStageTimeline($lead, $history);

        // Files uploaded against Documents-tab checklist items, grouped by
        // the item's frontend key so the gallery card can render each list.
        $checklistFiles = \App\Models\LeadDocument::where('lead_id', $lead->id)
            ->whereNotNull('checklist_key')
            ->with('uploader:id,name')
            ->orderBy('created_at')
            ->get()
            ->groupBy('checklist_key')
            ->map(fn ($files) => $files->map(fn ($f) => [
                'id'            => $f->id,
                'original_name' => $f->original_name,
                'mime'          => $f->mime,
                'size'          => $f->size,
                'status'        => $f->status,
                'uploaded_by'   => optional($f->uploader)->name,
                'created_at'    => $f->created_at,
            ])->values());

        return inertia($page, [
            'lead'           => $lead,
            'activity'       => $activity,
            'stageTimeline'  => $stageTimeline,
            'checklistFiles' => $checklistFiles,
            'notes'         => $notes,
            'tags'          => $leadTags,
            'allTags'       => $allTags,
            'tasks'         => $tasks,
            'staffOptions'  => $staffOptions,
            'currentUser'   => auth()->user()
                ? ['id' => auth()->id(), 'name' => auth()->user()->name, 'role' => auth()->user()->role, 'is_admin' => auth()->user()->isAdmin()]
                : null,
            'statuses'      => \App\Models\Lead::STAGES,
        ]);
    }

    /**
     * Build the lead's journey timeline from audit-log entries. Mixes three
     * event types into one chronological feed:
     *   - 'stage'     — pipeline transitions (status field changed)
     *   - 'prescreen' — pre-screening captures (prescreened_by/notes touched)
     *   - 'goal'      — goal-setting captures (goal_setting_status/by/notes touched)
     *
     * The most recent 'stage' entry is flagged is_current so the frontend
     * can highlight it.
     *
     * @return array<int, array<string, mixed>>
     */
    private function buildStageTimeline(Lead $lead, $history): array
    {
        $iso = fn ($t) => $t ? \Illuminate\Support\Carbon::parse($t)->toIso8601String() : null;

        $events = collect();

        // 1. Initial stage at lead creation — gives the timeline a starting
        // anchor before any audit entries exist.
        $stageChanges = collect($history)
            ->filter(fn ($h) => is_array($h['changes'] ?? null) && isset($h['changes']['status']))
            ->sortBy('created_at')
            ->values();

        $initialStage = $stageChanges->isNotEmpty()
            ? ($stageChanges->first()['changes']['status']['old'] ?? $lead->status)
            : $lead->status;

        $events->push([
            'type'       => 'stage',
            'stage'      => $initialStage,
            'entered_at' => $iso($lead->created_at),
            'actor_name' => null,
            'is_current' => false,
            'detail'     => null,
        ]);

        // 2. Each subsequent stage transition.
        foreach ($stageChanges as $change) {
            $events->push([
                'type'       => 'stage',
                'stage'      => $change['changes']['status']['new'] ?? null,
                'entered_at' => $iso($change['created_at']),
                'actor_name' => $change['actor_name'] ?? null,
                'is_current' => false,
                'detail'     => null,
            ]);
        }

        // 3. Pre-screening captures — any save that touched prescreened_by
        // or prescreened_notes.
        foreach ($history as $h) {
            $c = $h['changes'] ?? null;
            if (! is_array($c)) continue;
            if (! isset($c['prescreened_by']) && ! isset($c['prescreened_notes'])) continue;

            $by    = $c['prescreened_by']['new']    ?? null;
            $notes = $c['prescreened_notes']['new'] ?? null;
            $events->push([
                'type'       => 'prescreen',
                'stage'      => $by ? "Pre-screened by {$by}" : 'Pre-screening updated',
                'entered_at' => $iso($h['created_at']),
                'actor_name' => $h['actor_name'] ?? null,
                'is_current' => false,
                'detail'     => $notes ? \Illuminate\Support\Str::limit($notes, 160) : null,
            ]);
        }

        // 4. Goal-setting captures — any save touching goal_setting_status,
        // goal_setting_by, or goal_setting_notes.
        foreach ($history as $h) {
            $c = $h['changes'] ?? null;
            if (! is_array($c)) continue;
            if (! isset($c['goal_setting_status']) && ! isset($c['goal_setting_by']) && ! isset($c['goal_setting_notes'])) continue;

            $status = $c['goal_setting_status']['new'] ?? null;
            $by     = $c['goal_setting_by']['new']     ?? null;
            $notes  = $c['goal_setting_notes']['new']  ?? null;

            $label = $status
                ? "Goal-setting: {$status}"
                : ($by ? "Goal-setting by {$by}" : 'Goal-setting updated');

            $events->push([
                'type'       => 'goal',
                'stage'      => $label,
                'entered_at' => $iso($h['created_at']),
                'actor_name' => $h['actor_name'] ?? null,
                'is_current' => false,
                'detail'     => $notes ? \Illuminate\Support\Str::limit($notes, 160) : null,
            ]);
        }

        // Sort all events chronologically, then mark the *last* stage event
        // as the current stage (everything after it is a side-event that
        // doesn't move the pipeline).
        $sorted = $events->sortBy('entered_at')->values();

        $lastStageKey = $sorted
            ->map(fn ($e, $i) => $e['type'] === 'stage' ? $i : null)
            ->filter(fn ($i) => $i !== null)
            ->last();

        if ($lastStageKey !== null) {
            $entry = $sorted[$lastStageKey];
            $entry['is_current'] = true;
            $entry['stage']      = $lead->status ?: $entry['stage'];
            $sorted[$lastStageKey] = $entry;
        }

        return $sorted->all();
    }

    /**
     * Merge the source touchpoints (forms filled, bookings, event link)
     * AND the audit-log entries (field/stage updates) into one
     * chronological feed for the Activity log tab.
     */
    private function buildActivityFeed(Lead $lead, $history): array
    {
        $items = collect();

        // 1. Source touchpoints — origin + bookings + event + resubmits.
        foreach ($this->collectSources($lead) as $src) {
            $items->push([
                'kind'       => 'source.' . $src['kind'],
                'title'      => $src['label'],
                'detail'     => $src['detail'],
                'reference'  => $src['reference'],
                'actor_name' => null,
                'actor_role' => null,
                'changes'    => null,
                'date'       => $src['date'],
            ]);
        }

        // 2. Field/stage updates from the audit log. Skip lead.created /
        // lead.resubmitted since those are already in the source feed.
        foreach ($history as $h) {
            in_array($h['action'], ['lead.created', 'lead.resubmitted'], true)
                ? null
                : $items->push([
                    'kind'       => $h['action'],
                    'title'      => $h['description'],
                    'detail'     => null,
                    'reference'  => null,
                    'actor_name' => $h['actor_name'],
                    'actor_role' => $h['actor_role'],
                    'changes'    => $h['changes'],
                    'date'       => $h['created_at'] ? \Illuminate\Support\Carbon::parse($h['created_at'])->toIso8601String() : null,
                ]);
        }

        return $items->sortByDesc('date')->values()->all();
    }

    /**
     * Build the chronological list of every form this lead has filled.
     * Combines the initial intake, linked bookings, event registration,
     * and any later resubmit entries logged by LeadIntakeService.
     */
    private function collectSources(Lead $lead): array
    {
        $items = collect();

        // 1. Original creation — derive the form type from source / lead_id prefix.
        $originLabel = $this->originLabel($lead);
        $items->push([
            'kind'      => 'origin',
            'label'     => $originLabel,
            'reference' => $lead->lead_id,
            'date'      => optional($lead->created_at)->toIso8601String(),
            'detail'    => $lead->source ?: null,
        ]);

        // 2. Bookings linked to this lead — surfaces every consultation booking.
        \App\Models\Booking::where('lead_id', $lead->id)
            ->orderBy('created_at')
            ->get()
            ->each(fn ($b) => $items->push([
                'kind'      => 'booking',
                'label'     => 'Booking — ' . ($b->service_type ?: 'Consultation'),
                'reference' => 'BK-' . $b->id,
                'date'      => optional($b->created_at)->toIso8601String(),
                'detail'    => $b->status
                    ? "Status: {$b->status}" . ($b->appointment_date ? ' · ' . \Illuminate\Support\Carbon::parse($b->appointment_date)->toFormattedDateString() : '')
                    : null,
            ]));

        // 3. Event registration — single direct link via leads.event_id.
        $lead->event
            ? $items->push([
                'kind'      => 'event',
                'label'     => 'Event — ' . $lead->event->name,
                'reference' => $lead->event->event_code,
                'date'      => optional($lead->created_at)->toIso8601String(),
                'detail'    => $lead->event->type ?: null,
            ])
            : null;

        // 4. Resubmits — every other form they filled after the first.
        \App\Models\ActivityLog::where('action', 'lead.resubmitted')
            ->where('properties->subject_id', $lead->id)
            ->orderBy('created_at')
            ->get()
            ->each(fn ($a) => $items->push([
                'kind'      => 'resubmit',
                'label'     => data_get($a->properties, 'form_type') ?: 'Resubmitted',
                'reference' => null,
                'date'      => optional($a->created_at)->toIso8601String(),
                'detail'    => count(data_get($a->properties, 'backfilled', [])) > 0
                    ? 'Backfilled: ' . implode(', ', data_get($a->properties, 'backfilled', []))
                    : null,
            ]));

        return $items->sortBy('date')->values()->all();
    }

    /** Human-readable label for the lead's first touchpoint. */
    private function originLabel(Lead $lead): string
    {
        $src = (string) $lead->source;

        return match (true) {
            str_starts_with((string) $lead->lead_id, 'FA-') => 'Free Assessment',
            $src === 'free-assessment'                      => 'Free Assessment',
            str_starts_with($src, 'quick-lead')             => 'Quick Lead — ' . trim(str_replace(['quick-lead:', 'quick-lead'], '', $src), ': '),
            $src === 'booking'                              => 'Booking',
            str_starts_with($src, 'event:')                 => 'Event Registration',
            $src !== ''                                     => ucwords(str_replace(['-', '_', ':'], ' ', $src)),
            default                                         => 'Lead created',
        };
    }

    /**
     * Update only the lead's stage/status. Accessible to all logged-in
     * staff (admin + every department portal) so any team member working
     * a lead can advance the pipeline. All transitions are audited via
     * the LogsActivity trait on the Lead model.
     */
    public function updateStage(\Illuminate\Http\Request $request, $id)
    {
        $validated = $request->validate([
            'status' => ['required', \Illuminate\Validation\Rule::in(\App\Models\Lead::STAGES)],
        ]);

        try {
            $lead = Lead::findOrFail($id);
            $lead->status = $validated['status'];
            $lead->save();

            return back()->with('success', "Stage updated to {$validated['status']}.");
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Lead stage update failed', ['id' => $id, 'error' => $e->getMessage()]);
            return back()->with('error', 'Could not update the stage.');
        }
    }

    /**
     * Save the lead's "Journey" panel — pre-screening + goal-setting captures
     * plus the two key dates. Any logged-in staff can edit (same scope as
     * stage updates); every change is audited via the LogsActivity trait.
     */
    public function updateJourney(\Illuminate\Http\Request $request, $id)
    {
        $validated = $request->validate([
            'date_of_first_contact' => 'nullable|date',
            'date_of_engagement'    => 'nullable|date',
            'prescreened_by'        => 'nullable|string|max:120',
            'prescreened_notes'     => 'nullable|string|max:2000',
            'goal_setting_status'   => ['nullable', \Illuminate\Validation\Rule::in([
                'Consultation Done', 'For Proposal', 'Proposal Sent', 'No Show',
            ])],
            'goal_setting_by'       => 'nullable|string|max:120',
            'goal_setting_notes'    => 'nullable|string|max:2000',
        ]);

        try {
            $lead = Lead::findOrFail($id);
            $lead->fill($validated);
            $lead->save();

            return back()->with('success', 'Journey updated.');
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Lead journey update failed', ['id' => $id, 'error' => $e->getMessage()]);
            return back()->with('error', 'Could not save the journey changes.');
        }
    }

    /**
     * Update one item in the document-checklist JSON. The frontend pushes
     * a single { key, status, date, notes } payload per change so we can
     * merge it into the existing JSON without round-tripping the whole
     * checklist on every keystroke.
     */
    public function updateDocumentChecklist(\Illuminate\Http\Request $request, $id)
    {
        $validated = $request->validate([
            'key'    => 'required|string|max:120',
            'status' => ['nullable', \Illuminate\Validation\Rule::in([
                'not_applicable', 'available', 'in_progress', 'uploaded',
            ])],
            'date'   => 'nullable|date',
            'notes'  => 'nullable|string|max:2000',
        ]);

        try {
            $lead = Lead::findOrFail($id);
            $checklist = is_array($lead->document_checklist) ? $lead->document_checklist : [];

            $checklist[$validated['key']] = array_filter([
                'status' => $validated['status'] ?? null,
                'date'   => $validated['date']   ?? null,
                'notes'  => $validated['notes']  ?? null,
            ], fn ($v) => $v !== null && $v !== '');

            // Drop empty entries entirely so leads with no progress stay clean.
            empty($checklist[$validated['key']])
                ? $checklist = array_diff_key($checklist, [$validated['key'] => null])
                : null;

            $lead->document_checklist = $checklist;
            $lead->save();

            return back()->with('success', 'Document checklist updated.');
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Lead document checklist update failed', ['id' => $id, 'error' => $e->getMessage()]);
            return back()->with('error', 'Could not save the checklist change.');
        }
    }

    /**
     * Staff verifies, requests revisions on, or resets a whole document
     * section. Verifying section N unlocks section N+1 on the lead portal.
     */
    public function updateSectionVerification(\Illuminate\Http\Request $request, $id)
    {
        $validated = $request->validate([
            'section_key' => 'required|string|max:60',
            'status'      => ['required', \Illuminate\Validation\Rule::in([
                'pending', 'in_review', 'verified', 'revisions_needed',
            ])],
            'notes'       => 'nullable|string|max:1000',
        ]);

        try {
            $lead = Lead::findOrFail($id);
            $sections = is_array($lead->section_verifications) ? $lead->section_verifications : [];

            $sections[$validated['section_key']] = array_filter([
                'status'         => $validated['status'],
                'notes'          => $validated['notes'] ?? null,
                'verified_at'    => $validated['status'] === 'verified' ? now()->toIso8601String() : null,
                'verified_by'    => $validated['status'] === 'verified' ? optional(auth()->user())->name : null,
                'verified_by_id' => $validated['status'] === 'verified' ? auth()->id() : null,
            ], fn ($v) => $v !== null && $v !== '');

            $lead->section_verifications = $sections;
            $lead->save();

            return back()->with('success', 'Section ' . str_replace('_', ' ', $validated['status']) . '.');
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Section verification update failed', ['id' => $id, 'error' => $e->getMessage()]);
            return back()->with('error', 'Could not update section verification.');
        }
    }
}
