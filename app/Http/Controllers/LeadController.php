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
        // A lead drops out of this view the moment it's adopted by any
        // department (student / English / immigration / accommodation).
        // Each department has its own queue surface; keeping them in the
        // sales-pipeline table would mean each row appears in two places.
        $leads = Lead::inLeadPipeline()
            ->with(['studyPlans', 'event'])
            ->latest()
            ->get();
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
        // Same programme catalogue Education Enrolment uses — keeps the
        // "Preferred Course/Program" dropdown consistent across both
        // public assessment funnels.
        $programs = \App\Models\Program::where('status', 'published')
            ->orderBy('level')
            ->orderBy('title')
            ->get(['id', 'title', 'level', 'institution']);

        return inertia('free-assessment/FreeAssessmentPage', [
            'programs' => $programs,
        ]);
    }

    /**
     * Show the Education Enrolment form — clean 7-step IntakeFormShell
     * version, not the full free-assessment payload.
     */
    public function showEducationEnrolment()
    {
        // Surface the published programme catalogue so the "Preferred
        // Course/Program" field on Step 3 (Study Plans) renders as a real
        // dropdown bound to the database, not a free-text input.
        $programs = \App\Models\Program::where('status', 'published')
            ->orderBy('level')
            ->orderBy('title')
            ->get(['id', 'title', 'level', 'institution']);

        return inertia('free-assessment/EducationEnrolmentPage', [
            'programs' => $programs,
        ]);
    }

    /**
     * Persist an in-progress assessment to the database so it shows up in
     * the Education / Sales assessments queue as a Draft. Fires from the
     * "Save draft" button on either /free-assessment or /education-enrolment.
     *
     * Lead dedupe runs through LeadIntakeService (same as every other
     * public form) so resubmitting the same email just updates the
     * existing draft row rather than creating duplicates.
     */
    public function saveAssessmentDraft(\Illuminate\Http\Request $request, \App\Services\LeadIntakeService $intake)
    {
        // Inertia + the browser send empty fields as "" — null them out so
        // `nullable|email` doesn't trip on blank optional values.
        $request->merge(collect($request->all())
            ->map(fn ($v) => is_string($v) && trim($v) === '' ? null : $v)
            ->all());

        // The applicant must have entered enough to identify them before
        // we'll create a database row. Less than this and a draft is just
        // their device's local copy.
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name'  => 'nullable|string|max:255',
            'email'      => 'required|email|max:255',
            'phone'      => 'nullable|string|max:40',
        ], [
            'first_name.required' => 'Add your first name to save the draft online.',
            'email.required'      => 'Add your email to save the draft online.',
            'email.email'         => 'Enter a valid email to save the draft online.',
        ]);

        $isEnrolment = $request->is('education-enrolment*');
        $source      = $isEnrolment ? 'education-enrolment' : 'free-assessment';

        try {
            $lead = $intake->ingest($source, [
                'lead_id'    => ($isEnrolment ? 'EE-' : 'FA-') . strtoupper(uniqid()),
                'first_name' => $validated['first_name'],
                'last_name'  => $validated['last_name'] ?? '',
                'email'      => $validated['email'],
                'phone'      => $validated['phone'] ?? null,
                'stage'      => 'Evaluation',
            ], $request);

            // Promote the lead to Draft only if it's not already further
            // along — never demote a Submitted/Engaged lead back to Draft.
            $shouldFlipToDraft = !in_array($lead->status, ['Submitted', 'Engaged', 'Converted', 'Completed', 'Closed'], true);

            // The assessment form IS the freshest source of truth for the
            // applicant's identity, so override the conservative "backfill
            // only" behaviour of LeadIntakeService for these fields. This
            // means staff see the current name/phone the applicant is using
            // right now, not whatever they typed into a Quick-Lead months ago.
            $lead->update(array_filter([
                'first_name'         => $validated['first_name'],
                'last_name'          => $validated['last_name'] ?? null,
                'phone'              => $validated['phone'] ?? null,
                'status'             => $shouldFlipToDraft ? 'Draft' : $lead->status,
                'source'             => $source,
                'ai_analysis'        => $request->except(['_token']),
                'ai_analysis_status' => 'completed',
            ], fn ($v) => $v !== null));

            // Use a distinct flash key so the page can tell a draft save
            // apart from the final submit — the latter sets `flash.success`
            // and flips the page to the success screen, which is NOT what
            // should happen on a save-draft click.
            //
            // For XHR auto-saves (Accept: application/json) we return a
            // small JSON body instead of a redirect so the fetch can
            // resolve quickly without re-rendering the whole page.
            if ($request->expectsJson() || $request->wantsJson()) {
                return response()->json([
                    'draft_saved' => true,
                    'draft_id'    => $lead->lead_id,
                    'saved_at'    => now()->toIso8601String(),
                ]);
            }
            return back()->with([
                'draft_saved' => true,
                'draft_id'    => $lead->lead_id,
            ]);
        } catch (\Throwable $e) {
            Log::error('Assessment draft save failed', ['error' => $e->getMessage()]);
            if ($request->expectsJson() || $request->wantsJson()) {
                return response()->json(['error' => 'Could not save draft.'], 500);
            }
            return back()->withErrors([
                'error' => 'Could not save draft — please try again.',
            ]);
        }
    }

    /**
     * Store the Education Enrolment payload — identical shape to the Free
     * Assessment form (same Step components, same field names). Delegates
     * straight to `storeFreeAssessment` so we get the full validation +
     * relational mapping + AI-analysis dispatch for free. The source tag is
     * picked from the request URL inside that method, so leads land tagged
     * as `education-enrolment` instead of `free-assessment`.
     */
    public function storeEducationEnrolmentFull(\Illuminate\Http\Request $request)
    {
        return $this->storeFreeAssessment($request);
    }

    /**
     * Legacy stub kept for any code path still referencing the old simpler
     * payload — no longer used by the page itself.
     */
    public function storeEducationEnrolment(\Illuminate\Http\Request $request, \App\Services\LeadIntakeService $intake)
    {
        // Convert blank strings to null so optional fields with format rules
        // (date/email) don't fail validation when left untouched.
        $request->merge(collect($request->all())
            ->map(fn ($v) => is_string($v) && trim($v) === '' ? null : $v)
            ->all());

        $validated = $request->validate([
            'terms_accepted'        => 'required|accepted',
            'first_name'            => 'required|string|max:120',
            'last_name'             => 'required|string|max:120',
            'dob'                   => 'required|date',
            'gender'                => 'nullable|string|max:40',
            'marital_status'        => 'nullable|string|max:40',
            'email'                 => 'required|email|max:255',
            'phone'                 => 'required|string|max:40',
            'country_of_birth'      => 'nullable|string|max:120',
            'place_of_birth'        => 'nullable|string|max:120',

            'citizenship'           => 'required|string|max:120',
            'residence_country'     => 'required|string|max:120',
            'residence_city'        => 'nullable|string|max:120',
            'has_passport'          => 'nullable|in:Yes,No',
            'passport_number'       => 'nullable|string|max:60',
            'passport_expiry'       => 'nullable|date',

            'preferred_area'        => 'required|string|max:120',
            'preferred_course'      => 'nullable|string|max:255',
            'qualification_level'   => 'required|string|max:120',
            'study_mode'            => 'nullable|string|max:60',
            'preferred_intake'      => 'nullable|string|max:120',
            'preferred_city'        => 'nullable|string|max:120',
            'preferred_institution' => 'nullable|string|max:255',
            'has_english_test'      => 'nullable|in:Yes,No',
            'english_test_type'     => 'nullable|string|max:60',
            'english_test_score'    => 'nullable|string|max:30',
            'english_test_date'     => 'nullable|date',
            'career_goals'          => 'nullable|string',

            'highest_qualification' => 'required|string|max:120',
            'institution_name'      => 'nullable|string|max:255',
            'country_of_study'      => 'nullable|string|max:120',
            'qualification_start'   => 'nullable|date',
            'qualification_end'     => 'nullable|date',
            'qualification_marks'   => 'nullable|string|max:30',
            'education_notes'       => 'nullable|string',

            'has_funds'             => 'required|in:Yes,No',
            'funding_source'        => 'nullable|string|max:60',
            'estimated_budget'      => 'required|string|max:60',
            'has_sponsor'           => 'nullable|in:Yes,No',
            'sponsor_relation'      => 'nullable|string|max:120',
            'sponsor_occupation'    => 'nullable|string|max:120',
            'sponsor_income'        => 'nullable|string|max:60',

            'declaration_accepted'  => 'required|accepted',
            'signature_name'        => 'nullable|string|max:255',
            'signature_date'        => 'nullable|date',
        ]);

        try {
            $lead = $intake->ingest('education-enrolment', [
                'lead_id'    => 'EE-' . strtoupper(uniqid()),
                'first_name' => $validated['first_name'],
                'last_name'  => $validated['last_name'],
                'email'      => $validated['email'],
                'phone'      => $validated['phone'],
                'country'    => $validated['residence_country'] ?? null,
                'stage'      => 'Education-Enrolment',
            ], $request);

            // Persist the rich assessment payload on the lead so staff see
            // the full picture without us adding a dedicated enrolment
            // table. Same place storeFreeAssessment writes its analysis.
            $lead->update([
                'source'             => 'education-enrolment',
                'status'             => 'New',
                'ai_analysis'        => array_diff_key($validated, array_flip([
                    'first_name', 'last_name', 'email', 'phone', 'residence_country',
                ])),
                'ai_analysis_status' => 'completed',
            ]);

            return redirect()->route('education-enrolment')->with([
                'success' => "Thanks {$validated['first_name']} — our education team will reach out within 1–2 business days.",
                'lead_id' => $lead->lead_id,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Education enrolment store failed', ['error' => $e->getMessage()]);
            return redirect()->back()->withErrors([
                'error' => 'Something went wrong submitting your enrolment. Please try again.',
            ])->withInput();
        }
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

            // Step 12 - Documents (Education Enrolment only — Free Assessment
            // doesn't send these so the nullable rule keeps it backwards-
            // compatible). Each file: up to 10 MB, in the formats listed
            // by the dropzone widget.
            'cv_files'           => 'nullable|array|max:10',
            'cv_files.*'         => 'file|mimes:pdf,doc,docx,xls,csv,jpg,jpeg,png,gif|max:10240',
            'passport_files'     => 'nullable|array|max:10',
            'passport_files.*'   => 'file|mimes:pdf,doc,docx,xls,csv,jpg,jpeg,png,gif|max:10240',
            'diploma_files'      => 'nullable|array|max:10',
            'diploma_files.*'    => 'file|mimes:pdf,doc,docx,xls,csv,jpg,jpeg,png,gif|max:10240',
            'transcript_files'   => 'nullable|array|max:10',
            'transcript_files.*' => 'file|mimes:pdf,doc,docx,xls,csv,jpg,jpeg,png,gif|max:10240',

            // Step 13 - Declaration
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

                // The applicant has explicitly clicked "Submit" — flip the
                // lead to 'Submitted' so the Education / Sales Assessments
                // queues can render the progress bar at the right stage.
                'status' => 'Submitted',
                'stage'  => 'Evaluation',
                // Same form, two URLs — keep the source tag accurate so
                // reporting can split free-assessment vs enrolment leads.
                'source' => $request->is('education-enrolment') ? 'education-enrolment' : 'free-assessment',
            ];

            // Update the existing lead with the full assessment payload —
            // assessment is our richest form so its fields take precedence
            // over any earlier partial submissions.
            $existing->update($payload);
            $lead = $existing->fresh();

            // 3b. Store Education Enrolment document uploads (CV / Passport /
            // Diploma / Transcript). Each lead gets its own folder under the
            // public disk; the stored paths are merged into education_notes
            // so the existing JSON column carries them — no migration needed.
            $docMap = [
                'cv_files'         => 'cv',
                'passport_files'   => 'passport',
                'diploma_files'    => 'diploma',
                'transcript_files' => 'transcript',
            ];
            $uploaded = [];
            foreach ($docMap as $field => $folder) {
                if (! $request->hasFile($field)) continue;
                foreach ((array) $request->file($field) as $uploadedFile) {
                    if (! $uploadedFile) continue;
                    $uploaded[$folder][] = $uploadedFile->store(
                        "enrolment-docs/{$lead->lead_id}/{$folder}",
                        'public'
                    );
                }
            }
            if (! empty($uploaded)) {
                $notes = $lead->education_notes ?? [];
                $notes['uploaded_files'] = $uploaded;
                $lead->update(['education_notes' => $notes]);
                $lead = $lead->fresh();
            }

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

        // Privacy Act 2020 — record every immigration-case view by staff for
        // the case-audit log. Lead-portal users (the client viewing their
        // own record) are excluded since they're not "staff viewing a case".
        if ($lead->is_immigration_case && auth()->check() && ! auth()->user()->isLead()) {
            try {
                \App\Models\CaseAuditView::create([
                    'lead_id'     => $lead->id,
                    'viewer_id'   => auth()->id(),
                    'viewer_name' => auth()->user()->name,
                    'viewer_role' => auth()->user()->role,
                    'action'      => 'view',
                    'context'     => 'lead detail',
                    'ip'          => request()->ip(),
                    'viewed_at'   => now(),
                ]);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Case audit view write failed', ['lead_id' => $lead->id, 'error' => $e->getMessage()]);
            }
        }

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
                'id'                  => $n->id,
                'body'                => $n->body,
                'author_name'         => $n->author_name ?: 'Unknown',
                'author_role'         => $n->author_role ?: 'staff',
                'user_id'             => $n->user_id,
                'pinned'              => $n->pinned,
                'kind'                => $n->kind ?: 'general',
                'pre_screened_by'     => $n->pre_screened_by,
                'pre_screen_mode'     => $n->pre_screen_mode,
                'pre_screen_date'     => $n->pre_screen_date,
                'goal_setting_status' => $n->goal_setting_status,
                'goal_setting_by'     => $n->goal_setting_by,
                'created_at'          => $n->created_at,
                'updated_at'          => $n->updated_at,
            ]);

        // Tags attached to this lead + a hint list of every tag in the
        // system (for the autocomplete chip in the UI).
        $leadTags = $lead->tags->map(fn ($t) => [
            'id' => $t->id, 'name' => $t->name, 'color' => $t->color,
        ]);
        $allTags = \App\Models\LeadTag::orderBy('name')->limit(50)->get(['id', 'name', 'color']);

        // Tasks — open first (sorted by due date), then completed.
        //
        // We pull the same fields the Task Board renders (status, type,
        // attachments, additional links) so the lead-detail Tasks card and
        // the Task Board show the same row regardless of which surface the
        // task was created from. Attachments are eager-loaded so the panel
        // can render a paperclip + file list inline.
        $tasks = \App\Models\LeadTask::with([
                'assignee:id,name', 'creator:id,name',
                'attachments', 'attachments.uploader:id,name',
            ])
            ->where(function ($q) use ($lead) {
                $q->where('lead_id', $lead->id)
                    ->orWhereJsonContains('additional_lead_ids', $lead->id);
            })
            ->orderBy('completed')
            ->orderByRaw('due_at IS NULL, due_at ASC')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($t) => [
                'id'           => $t->id,
                'title'        => $t->title,
                'description'  => $t->description,
                'note'         => $t->note,
                'status'       => $t->status,
                'type'         => $t->type,
                'progress'     => $t->progress,
                'due_at'       => $t->due_at,
                'priority'     => $t->priority,
                'completed'    => $t->completed,
                'completed_at' => $t->completed_at,
                'overdue'      => ! $t->completed && $t->due_at && $t->due_at->isPast(),
                'assignee'     => $t->assignee ? ['id' => $t->assignee->id, 'name' => $t->assignee->name] : null,
                'additional_assignee_ids' => $t->additional_assignee_ids ?? [],
                'additional_lead_ids'     => $t->additional_lead_ids ?? [],
                'created_by'   => $t->created_by,
                'creator'      => $t->creator ? ['id' => $t->creator->id, 'name' => $t->creator->name] : null,
                'attachments'  => $t->attachments->map(fn ($a) => [
                    'id'                => $a->id,
                    'url'               => $a->url,
                    'original_filename' => $a->original_filename,
                    'mime_type'         => $a->mime_type,
                    'size'              => $a->size,
                    'is_image'          => $a->is_image,
                    'uploader'          => $a->uploader ? ['id' => $a->uploader->id, 'name' => $a->uploader->name] : null,
                ])->values(),
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
                'id'             => $f->id,
                'original_name'  => $f->original_name,
                'mime'           => $f->mime,
                'size'           => $f->size,
                'status'         => $f->status,
                'source'         => $f->source,
                'source_variant' => $f->source_variant,
                'uploaded_by'    => optional($f->uploader)->name,
                'created_at'     => $f->created_at,
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
     * Edit the lead's Personal Info tab — drives all 9 section cards
     * on the lead detail page (Identity, Passport, Current NZ Visa,
     * Study Plans, Financial, Employment, Education, Family, Health &
     * Character). The validator allow-list is exhaustive; any column
     * absent from the list is silently dropped, so frontend bugs can
     * never write to forbidden columns.
     *
     * Section saves are partial-payload friendly — the frontend only
     * posts the section being edited, so `first_name` is required
     * (it's also the row's display label) but every other field is
     * optional and only updated when included.
     *
     * Conditional rules run after the main validator so the "if X is
     * true, Y is required" pattern lands on the right field key. JSON
     * responses are returned for Inertia + clean back() flashes for
     * the legacy form post.
     */
    public function updatePersonal(\Illuminate\Http\Request $request, $id)
    {
        $rules = [
            // ── Section 1 · Personal identity ────────────────────────
            'first_name'                       => 'required|string|max:120',
            'last_name'                        => 'nullable|string|max:120',
            'middle_name'                      => 'nullable|string|max:120',
            'suffix'                           => 'nullable|string|max:20',
            'other_names'                      => 'nullable|string|max:200',
            'preferred_name'                   => 'nullable|string|max:100',
            'email'                            => 'nullable|email|max:200',
            'phone'                            => 'nullable|string|max:40',
            'whatsapp'                         => 'nullable|string|max:40',
            'gender'                           => 'nullable|string|max:30',
            'marital_status'                   => ['nullable', \Illuminate\Validation\Rule::in([
                'Single', 'Married', 'De Facto', 'Civil Union', 'Divorced', 'Widowed', 'Separated',
            ])],
            'dob'                              => 'nullable|date|before:today',
            'country_of_birth'                 => 'nullable|string|max:120',
            'place_of_birth'                   => 'nullable|string|max:120',
            'citizenship'                      => 'nullable|string|max:120',
            'residence_city'                   => 'nullable|string|max:160',
            'residence_country'                => 'nullable|string|max:120',
            'residence_address_line_1'         => 'nullable|string|max:200',
            'residence_address_line_2'         => 'nullable|string|max:200',
            'residence_address_postcode'       => 'nullable|string|max:20',
            'has_been_in_nz_continuously'      => 'nullable|boolean',
            'nz_continuous_residence_months'   => 'nullable|integer|min:0|max:600',

            // ── Section 2 · Passport ─────────────────────────────────
            'has_passport'                     => 'nullable|boolean',
            'passport_number'                  => 'nullable|string|max:50',
            'passport_issuing_country'         => 'nullable|string|max:120',
            'passport_issue_date'              => 'nullable|date',
            'passport_expiry'                  => 'nullable|date',

            // ── Section 3 · Current NZ visa ──────────────────────────
            'current_nz_visa_type'             => 'nullable|string|max:120',
            'current_nz_visa_number'           => 'nullable|string|max:50',
            'current_nz_visa_issued_date'      => 'nullable|date',
            'current_nz_visa_expiry_date'      => 'nullable|date',
            'previous_nz_visa_type'            => 'nullable|string|max:120',

            // ── Section 4 · Study plans ──────────────────────────────
            'preferred_course'                 => 'nullable|string|max:200',
            'preferred_qualification_level'    => 'nullable|string|max:120',
            'preferred_city_of_study'          => 'nullable|string|max:120',
            'preferred_intake'                 => 'nullable|string|max:120',
            'english_test_type'                => 'nullable|string|max:30',
            'english_test_overall_score'       => 'nullable|numeric|min:0|max:100',
            'english_test_listening'           => 'nullable|numeric|min:0|max:100',
            'english_test_reading'             => 'nullable|numeric|min:0|max:100',
            'english_test_writing'             => 'nullable|numeric|min:0|max:100',
            'english_test_speaking'            => 'nullable|numeric|min:0|max:100',
            'english_test_date'                => 'nullable|date',
            'target_institution'               => 'nullable|string|max:200',

            // ── Section 5 · Financial ────────────────────────────────
            'funding_source'                   => ['nullable', \Illuminate\Validation\Rule::in(['Self', 'Sponsor', 'Scholarship', 'Loan', 'Mixed'])],
            'estimated_total_cost_nzd'         => 'nullable|numeric|min:0|max:10000000',
            'available_funds_nzd'              => 'nullable|numeric|min:0|max:10000000',
            'supports_partner_or_dependents'   => 'nullable|boolean',
            'has_property_in_home_country'     => 'nullable|boolean',
            'annual_income_nzd'                => 'nullable|numeric|min:0|max:10000000',
            'annual_income_currency'           => 'nullable|string|size:3',
            'bank_funds_evidence_provided'     => 'nullable|boolean',

            // ── Section 6 · Employment ───────────────────────────────
            'employment_type'                  => ['nullable', \Illuminate\Validation\Rule::in(['Employed', 'Self-employed', 'Unemployed', 'Student', 'Retired'])],
            'current_employer_name'            => 'nullable|string|max:200',
            'current_position_title'           => 'nullable|string|max:200',
            'current_employer_country'         => 'nullable|string|max:120',
            'current_employer_phone'           => 'nullable|string|max:50',
            'current_employer_email'           => 'nullable|email|max:200',
            'current_employment_start_date'    => 'nullable|date',
            'current_salary_nzd'               => 'nullable|numeric|min:0|max:10000000',
            'years_of_relevant_experience'     => 'nullable|integer|min:0|max:80',
            'has_anzsco_listed_role'           => 'nullable|boolean',
            'anzsco_code'                      => 'nullable|string|max:10',
            'has_nz_professional_registration' => 'nullable|boolean',
            'nz_professional_registration_body' => 'nullable|string|max:200',

            // ── Section 7 · Education background ─────────────────────
            'highest_qualification'                 => ['nullable', \Illuminate\Validation\Rule::in([
                'Doctorate', 'Master', 'Postgraduate Diploma', 'Bachelor', 'Diploma', 'Certificate', 'High School', 'None',
            ])],
            'highest_qualification_field'           => 'nullable|string|max:200',
            'highest_qualification_country'         => 'nullable|string|max:120',
            'highest_qualification_year_completed'  => 'nullable|integer|min:1900|max:2050',
            'has_nzqa_assessment'                   => 'nullable|boolean',
            'nzqa_assessment_level'                 => 'nullable|string|max:120',

            // ── Section 8 · Family ───────────────────────────────────
            'has_children'              => 'nullable|boolean',
            'number_of_children'        => 'nullable|integer|min:0|max:20',
            'dependent_children_notes'  => 'nullable|string|max:5000',
            'has_dependent_partner'     => 'nullable|boolean',
            'partner_in_nz'             => 'nullable|boolean',
            'intends_to_bring_family'   => 'nullable|boolean',

            // ── Section 9 · Health & character ───────────────────────
            'has_health_disclosure'        => 'nullable|boolean',
            'health_disclosure_notes'      => 'nullable|string|max:2000',
            'has_character_disclosure'     => 'nullable|boolean',
            'character_disclosure_notes'   => 'nullable|string|max:2000',
            'has_been_declined_visa'       => 'nullable|boolean',
            'declined_visa_details'        => 'nullable|string|max:2000',
            'has_criminal_record'          => 'nullable|boolean',
            'criminal_record_details'      => 'nullable|string|max:2000',
            'meets_184_day_rule_two_years' => 'nullable|boolean',
        ];

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), $rules);

        // Conditional rules — each "if X then Y must …" check writes the
        // error onto the dependent field key so the frontend can render
        // it inline next to the right input.
        $validator->after(function ($v) use ($request) {
            $bool = function ($key) use ($request): bool {
                $val = $request->input($key);
                return $val === true || $val === 'true' || $val === 1 || $val === '1';
            };

            if ($bool('has_passport') && trim((string) $request->input('passport_number')) === '') {
                $v->errors()->add('passport_number', 'Passport number is required when "Has passport" is yes.');
            }

            $emp = $request->input('employment_type');
            if (in_array($emp, ['Employed', 'Self-employed'], true)
                && trim((string) $request->input('current_employer_name')) === ''
            ) {
                $v->errors()->add('current_employer_name', 'Current employer is required when employment type is Employed or Self-employed.');
            }

            $disclosurePairs = [
                'has_health_disclosure'    => ['health_disclosure_notes',    'Health disclosure notes are required when "Has health disclosure" is yes.'],
                'has_character_disclosure' => ['character_disclosure_notes', 'Character disclosure notes are required when "Has character disclosure" is yes.'],
                'has_been_declined_visa'   => ['declined_visa_details',      'Declined-visa details are required when "Has been declined a visa" is yes.'],
                'has_criminal_record'      => ['criminal_record_details',    'Criminal-record details are required when "Has criminal record" is yes.'],
            ];
            foreach ($disclosurePairs as $flag => [$noteKey, $msg]) {
                if ($bool($flag) && strlen(trim((string) $request->input($noteKey, ''))) < 10) {
                    $v->errors()->add($noteKey, $msg . ' (min 10 characters)');
                }
            }

            if ($bool('has_children')) {
                $count = (int) $request->input('number_of_children', 0);
                if ($count <= 0) {
                    $v->errors()->add('number_of_children', 'Number of children must be at least 1 when "Has children" is yes.');
                }
            }
        });

        $validated = $validator->validate();

        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $request, $id) {
                $lead = Lead::findOrFail($id);

                // Partial-payload model: only update keys that were
                // actually sent. Empty-string normalisation to null
                // applies just to the keys present in the request so
                // a section save can't accidentally wipe other section
                // fields by omitting them.
                $patch = collect($validated)
                    ->filter(fn ($v, $k) => $request->has($k))
                    ->map(fn ($v) => $v === '' ? null : $v)
                    ->all();

                $lead->fill($patch);
                $lead->save();

                // Inertia treats JSON as a non-Inertia response and
                // bounces to a JSON page; sticking with back() keeps
                // the page state intact and lets the frontend rely on
                // flash messages + page-prop refresh.
                return back()->with('success', 'Personal information updated.');
            });
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Lead personal update failed', ['id' => $id, 'error' => $e->getMessage()]);
            return back()->with('error', 'Could not update personal information.');
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
     * Convert a lead into a student — flip the is_student flag, stamp who
     * and when. Same record stays; everything (documents, notes, history)
     * remains attached. Reversible via revertStudent() below.
     */
    public function convertToStudent($id)
    {
        try {
            $lead = Lead::findOrFail($id);
            if ($lead->is_student) {
                return back()->with('error', 'This lead is already a student.');
            }
            $lead->fill([
                'is_student'           => true,
                'student_converted_at' => now(),
                'student_converted_by' => auth()->id(),
            ])->save();
            return back()->with('success', "Lead {$lead->lead_id} is now a student.");
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Convert to student failed', ['id' => $id, 'error' => $e->getMessage()]);
            return back()->with('error', 'Could not convert this lead.');
        }
    }

    /**
     * Bulk-import leads from a CSV. Tolerant header matching; unmapped
     * columns fall into the family_info JSON. Duplicates are detected by
     * email OR (first_name + last_name + phone); existing leads get
     * empty-field backfill only, never overwrites.
     */
    public function importLeads(\Illuminate\Http\Request $request)
    {
        $request->validate([
            // Extension allow-list (csv/txt/xls/xlsx). Real CSVs — including
            // BOM-prefixed ones — are detected as text/plain and pass; binaries
            // like .exe/.php are rejected.
            'file' => 'required|' . \App\Support\UploadValidation::spreadsheet(),
        ]);

        // Big imports can run long — give them room.
        @set_time_limit(0);
        @ini_set('memory_limit', '512M');

        try {
            $path = $request->file('file')->getRealPath();
            $fh   = fopen($path, 'r');
            if (! $fh) return back()->with('error', 'Could not read the file.');

            // Strip a UTF-8 BOM if Excel left one in the first cell.
            $bom = fread($fh, 3);
            if ($bom !== "\xEF\xBB\xBF") rewind($fh);

            $headerRaw = fgetcsv($fh);
            if (! $headerRaw) return back()->with('error', 'The file appears to be empty.');

            // Normalise headers: lowercase, alnum-only, used as the lookup key.
            $headers = array_map(fn ($h) => preg_replace('/[^a-z0-9]/', '', strtolower((string) $h)), $headerRaw);

            $created = 0; $updated = 0; $skipped = 0; $errors = [];
            $rowNum = 1;

            while (($row = fgetcsv($fh)) !== false) {
                $rowNum++;
                // Skip fully-empty rows.
                if (collect($row)->filter(fn ($v) => trim((string) $v) !== '')->isEmpty()) {
                    continue;
                }

                // Pre-declare so the row-level catch can reference them
                // even if the throw happened before assignment.
                $first = ''; $last = ''; $email = ''; $phone = '';

                // Each row gets its own try/catch — one bad row no longer
                // aborts the entire import. Errors land in the summary so
                // staff can see exactly what failed and re-import just
                // those rows after fixing.
                try {

                $raw = $this->mapRow($headers, $row);
                $first = trim((string) ($raw['firstname'] ?? $raw['first'] ?? ''));
                $last  = trim((string) ($raw['lastname']  ?? $raw['surname'] ?? $raw['familyname'] ?? $raw['last'] ?? ''));
                $email = trim((string) ($raw['email'] ?? $raw['emailaddress'] ?? ''));
                $phone = trim((string) ($raw['phone'] ?? $raw['mobile'] ?? $raw['phonenumber'] ?? ''));

                // Need at least one of: email, OR (first + last + phone).
                if (! $email && ! ($first && $last && $phone)) {
                    $skipped++;
                    $id = $first || $last ? trim("{$first} {$last}") : '(no name)';
                    $missing = [];
                    if (! $email) $missing[] = 'email';
                    if (! $first || ! $last) $missing[] = 'name';
                    if (! $phone) $missing[] = 'phone';
                    $errors[] = "Row {$rowNum} [{$id}] — missing " . implode(' + ', $missing);
                    continue;
                }

                // Normalise stage to the canonical Lead::STAGES casing so
                // the pipeline filters and dashboards group these leads
                // alongside everything else.
                $normalisedStage = $this->normaliseStage($raw['stage'] ?? null);

                // Build the payload from known direct mappings. first_name
                // and last_name are NOT NULL in the schema; substitute ''
                // when the CSV only has one half so the insert succeeds.
                $optional = array_filter([
                    'email'                 => $email ?: null,
                    'phone'                 => $phone ?: null,
                    'stage'                 => $normalisedStage,
                    'dob'                   => $this->parseDate($raw['dateofbirth'] ?? $raw['dob'] ?? null),
                    'age'                   => isset($raw['age']) && is_numeric($raw['age']) ? (int) $raw['age'] : null,
                    'marital_status'        => $raw['maritalstatus'] ?? null,
                    'residence_city'        => $raw['city'] ?? $raw['currentcity'] ?? null,
                    'gender'                => $raw['gender'] ?? null,
                    // Sales-dashboard mirror columns. Only set when the
                    // value is a real link / parseable date so we don't
                    // overwrite real data with the literal labels staff
                    // sometimes type into the sheet ("ePathways PH Call
                    // Update Form" etc).
                    'calendar_date'         => $this->parseDate($raw['calendar'] ?? null),
                    'client_info_link'      => filter_var($raw['clientinformationlink'] ?? '', FILTER_VALIDATE_URL) ?: null,
                    'call_update_form_link' => filter_var($raw['callupdateformlink'] ?? '', FILTER_VALIDATE_URL) ?: null,
                ], fn ($v) => $v !== null && $v !== '');

                $payload = array_merge([
                    'first_name' => $first,
                    'last_name'  => $last,
                ], $optional);

                // JSON buckets — mapped against the actual normalised CSV
                // headers. Falls back through several variants so an
                // adjacent column name still maps cleanly.
                $educationNotes = array_filter([
                    'current_education_attainment' => $raw['currenteducationattainment'] ?? $raw['currenteducation'] ?? null,
                    'bachelor_course'              => $raw['ifbachelorsdegreewhatcourse'] ?? $raw['ifbachelor'] ?? null,
                ], fn ($v) => $v !== null && $v !== '');

                $workInfo = array_filter([
                    'current_job'      => $raw['currentjoboccupation'] ?? $raw['currentjob'] ?? null,
                    'current_location' => $raw['currentlocation'] ?? null,
                ], fn ($v) => $v !== null && $v !== '');

                $familyInfo = array_filter([
                    // Pathway / intent
                    'pathway'                  => $raw['whatpathwayareyouinterestedin'] ?? $raw['whatpathway'] ?? $raw['whatpath'] ?? null,
                    'willing_to_invest'        => $raw['areyouwillingtoinvestinstudyingabroad'] ?? null,
                    'willing_to_proceed'       => $raw['areyouwillingtoproceedwithyourstudentvisaapplicationfornewzealand'] ?? null,
                    'preferred_contact_time'   => $raw['preferredtimeforacallaftercompletingtheform'] ?? $raw['preferredtime'] ?? null,

                    // Partner / spouse
                    'partner_name'             => $raw['fullnameofpartnerspouse'] ?? $raw['partnersp'] ?? null,
                    'partner_age'              => $raw['ageofpartnerspouse'] ?? $raw['ageofpartner'] ?? null,
                    'partner_education'        => $raw['partnerspousecurrenteducationlevel'] ?? null,
                    'partner_education_other'  => $raw['otherpartnerspousecurrenteducationlevel'] ?? $raw['otherpartnersp'] ?? null,
                    'partner_work_experience'  => $raw['partnerspousecurrentworkexperience'] ?? null,
                    'partner_years_experience' => $raw['partnerspouseyearsofexperience'] ?? $raw['partneryearsofexperience'] ?? $raw['yearsofexperience'] ?? null,

                    // Children
                    'number_of_children'       => $raw['numberofchildren'] ?? $raw['numberofchild'] ?? null,
                    'children_ages'            => $raw['childage'] ?? $raw['childrenages'] ?? null,
                    'will_bring_children'      => $raw['willyoubringyourchildren'] ?? $raw['willyoubring'] ?? null,
                    'will_bring_children_other'=> $raw['otherwillyoubringyourchildren'] ?? $raw['otherwillpartnerspouse'] ?? null,
                ], fn ($v) => $v !== null && $v !== '');

                // Call Notes — write as a LeadNote row, NOT on the lead itself.
                $callNotes = trim((string) ($raw['callnotes'] ?? ''));

                // ── Dedupe ────────────────────────────────────────────────
                $existing = Lead::where(function ($q) use ($email, $first, $last, $phone) {
                    if ($email) $q->whereRaw('LOWER(email) = ?', [strtolower($email)]);
                    if ($first && $last && $phone) {
                        $q->orWhere(function ($q2) use ($first, $last, $phone) {
                            $q2->whereRaw('LOWER(first_name) = ?', [strtolower($first)])
                               ->whereRaw('LOWER(last_name)  = ?', [strtolower($last)])
                               ->where('phone', $phone);
                        });
                    }
                })->first();

                if ($existing) {
                    // Backfill only — don't overwrite filled fields.
                    $backfill = collect($payload)->filter(fn ($v, $k) => empty($existing->{$k}))->all();

                    // Status/stage casing-fix — if the existing lead's
                    // status doesn't match a canonical Lead::STAGES value
                    // (likely from a prior import with UPPERCASE), but the
                    // normalised version of it does, snap it to canonical.
                    if ($normalisedStage && in_array($normalisedStage, Lead::STAGES, true)) {
                        if (! in_array($existing->status, Lead::STAGES, true)) {
                            $backfill['status'] = $normalisedStage;
                        }
                        if (! in_array($existing->stage, Lead::STAGES, true)) {
                            $backfill['stage'] = $normalisedStage;
                        }
                    }

                    // Merge JSON columns rather than replacing.
                    $existingEducation = is_array($existing->education_notes) ? $existing->education_notes : [];
                    $existingWork      = is_array($existing->work_info) ? $existing->work_info : [];
                    $existingFamily    = is_array($existing->family_info) ? $existing->family_info : [];

                    $mergedEducation = array_merge($educationNotes, $existingEducation);
                    $mergedWork      = array_merge($workInfo, $existingWork);
                    $mergedFamily    = array_merge($familyInfo, $existingFamily);

                    if ($mergedEducation !== $existingEducation) $backfill['education_notes'] = $mergedEducation;
                    if ($mergedWork      !== $existingWork)      $backfill['work_info']       = $mergedWork;
                    if ($mergedFamily    !== $existingFamily)    $backfill['family_info']     = $mergedFamily;

                    if (! empty($backfill)) {
                        $existing->fill($backfill)->save();
                    }
                    $leadForNote = $existing;
                    $updated++;
                } else {
                    // Create new.
                    $payload['lead_id']    = 'LP-' . str_pad((string) ((int) Lead::max('id') + 1001), 5, '0', STR_PAD_LEFT);
                    $payload['source']     = 'csv-import';
                    // status uses the canonical stage too — keeps the
                    // pipeline filter chips matching after import.
                    $payload['status']     = $normalisedStage ?: 'New Leads';
                    $payload['education_notes'] = $educationNotes ?: null;
                    $payload['work_info']       = $workInfo ?: null;
                    $payload['family_info']     = $familyInfo ?: null;

                    $leadForNote = Lead::create($payload);
                    $created++;

                    // Preserve the source-system's original Created /
                    // Updated timestamps if the CSV provided them. Uses
                    // saveQuietly so the LogsActivity trait doesn't fire
                    // a spurious "lead.updated" entry for the back-dating.
                    $csvCreated = $this->parseTs($raw['created'] ?? null);
                    $csvUpdated = $this->parseTs($raw['updated'] ?? null);
                    if ($csvCreated || $csvUpdated) {
                        $leadForNote->forceFill([
                            'created_at' => $csvCreated ?? $leadForNote->created_at,
                            'updated_at' => $csvUpdated ?? $csvCreated ?? $leadForNote->updated_at,
                        ])->saveQuietly();
                    }
                }

                // Capture Call Notes as a real LeadNote row.
                if ($callNotes && $leadForNote) {
                    try {
                        \App\Models\LeadNote::create([
                            'lead_id'    => $leadForNote->id,
                            'user_id'    => auth()->id(),
                            'author_name'=> optional(auth()->user())->name ?: 'CSV Import',
                            'author_role'=> optional(auth()->user())->role ?: 'system',
                            'body'       => $callNotes,
                        ]);
                    } catch (\Throwable $e) {
                        \Illuminate\Support\Facades\Log::warning('Import note create failed', ['lead_id' => $leadForNote->id, 'error' => $e->getMessage()]);
                    }
                }

                } catch (\Throwable $e) {
                    // One row failed — log it, continue with the rest.
                    $skipped++;
                    $id = ($first || $last) ? trim("{$first} {$last}") : ($email ?: '(no name)');
                    $errors[] = "Row {$rowNum} [{$id}] — " . $e->getMessage();
                    \Illuminate\Support\Facades\Log::warning('Lead import row failed', ['row' => $rowNum, 'error' => $e->getMessage()]);
                }
            }
            fclose($fh);

            $msg = "Import complete — created {$created}, updated {$updated}, skipped {$skipped}.";
            return back()
                ->with('success', $msg)
                ->with('import_summary', ['created' => $created, 'updated' => $updated, 'skipped' => $skipped, 'errors' => array_slice($errors, 0, 50)]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Lead import failed', ['error' => $e->getMessage()]);
            return back()->with('error', 'Import failed: ' . $e->getMessage());
        }
    }

    /**
     * Build a row payload keyed by the normalised header. When the CSV
     * has duplicate column names (e.g. two "Marital Status" columns —
     * one filled, one empty), keep whichever value is non-empty rather
     * than letting the later occurrence wipe out the earlier one.
     */
    private function mapRow(array $headers, array $row): array
    {
        $out = [];
        foreach ($headers as $i => $h) {
            if ($h === '') continue;
            $val = trim((string) ($row[$i] ?? ''));
            if (! isset($out[$h]) || $out[$h] === '') {
                $out[$h] = $val;
            }
        }
        return $out;
    }

    /**
     * Map a raw CSV stage value (often UPPERCASE or near-canonical) onto
     * the closest entry in Lead::STAGES. Falls back to the raw value if
     * no match — better to keep the original than to silently drop.
     */
    private function normaliseStage(?string $raw): ?string
    {
        $s = trim((string) $raw);
        if ($s === '') return null;
        $needle = preg_replace('/[^a-z0-9]/', '', strtolower($s));

        // Build lookup once per request.
        static $map = null;
        if ($map === null) {
            $map = [];
            foreach (Lead::STAGES as $canonical) {
                $map[preg_replace('/[^a-z0-9]/', '', strtolower($canonical))] = $canonical;
            }
        }

        return $map[$needle] ?? $s;
    }

    /** Parse a date string in any common format — returns ISO or null. */
    private function parseDate(?string $s): ?string
    {
        $s = trim((string) $s);
        if (! $s) return null;
        try {
            return \Illuminate\Support\Carbon::parse($s)->toDateString();
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Parse a full timestamp (date + time + offset) — returns a Carbon
     * instance or null. Used to preserve the CSV's original Created /
     * Updated timestamps when back-dating imported leads.
     */
    private function parseTs(?string $s)
    {
        $s = trim((string) $s);
        if (! $s) return null;
        try {
            return \Illuminate\Support\Carbon::parse($s);
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function convertToCase($id)
    {
        try {
            $lead = Lead::findOrFail($id);
            if ($lead->is_immigration_case) return back()->with('error', 'Already an immigration case.');
            $lead->fill([
                'is_immigration_case'      => true,
                'immigration_converted_at' => now(),
                'immigration_converted_by' => auth()->id(),
            ])->save();
            return back()->with('success', "Lead {$lead->lead_id} is now an immigration case.");
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Convert to case failed', ['id' => $id, 'error' => $e->getMessage()]);
            return back()->with('error', 'Could not convert this lead.');
        }
    }

    public function revertCase($id)
    {
        try {
            $lead = Lead::findOrFail($id);
            $lead->fill(['is_immigration_case' => false, 'immigration_converted_at' => null, 'immigration_converted_by' => null])->save();
            return back()->with('success', "Lead {$lead->lead_id} reverted.");
        } catch (\Throwable $e) {
            return back()->with('error', 'Could not revert.');
        }
    }

    public function convertToAccommodation($id)
    {
        try {
            $lead = Lead::findOrFail($id);
            if ($lead->is_accommodation_client) return back()->with('error', 'Already an accommodation client.');
            $lead->fill([
                'is_accommodation_client'    => true,
                'accommodation_converted_at' => now(),
                'accommodation_converted_by' => auth()->id(),
            ])->save();
            return back()->with('success', "Lead {$lead->lead_id} is now an accommodation client.");
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Convert to accommodation failed', ['id' => $id, 'error' => $e->getMessage()]);
            return back()->with('error', 'Could not convert this lead.');
        }
    }

    public function revertAccommodation($id)
    {
        try {
            $lead = Lead::findOrFail($id);
            $lead->fill(['is_accommodation_client' => false, 'accommodation_converted_at' => null, 'accommodation_converted_by' => null])->save();
            return back()->with('success', "Lead {$lead->lead_id} reverted.");
        } catch (\Throwable $e) {
            return back()->with('error', 'Could not revert.');
        }
    }

    /**
     * Convert a lead into an English-team student. Mirrors the
     * is_student / is_immigration_case / is_accommodation_client trio
     * so the English team gets a "Cases" queue and the lead drops out
     * of the Sales pipeline view.
     */
    public function convertToEnglish($id)
    {
        try {
            $lead = Lead::findOrFail($id);
            if ($lead->is_english_student) {
                return back()->with('error', 'Already an English student.');
            }
            $lead->fill([
                'is_english_student'   => true,
                'english_converted_at' => now(),
                'english_converted_by' => auth()->id(),
            ])->save();
            return back()->with('success', "Lead {$lead->lead_id} is now an English student.");
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Convert to English failed', ['id' => $id, 'error' => $e->getMessage()]);
            return back()->with('error', 'Could not convert this lead.');
        }
    }

    public function revertEnglish($id)
    {
        try {
            $lead = Lead::findOrFail($id);
            $lead->fill([
                'is_english_student'   => false,
                'english_converted_at' => null,
                'english_converted_by' => null,
            ])->save();
            return back()->with('success', "Lead {$lead->lead_id} reverted.");
        } catch (\Throwable $e) {
            return back()->with('error', 'Could not revert.');
        }
    }

    /**
     * Manually (re)send the lead their /track/{code} tracker link. Used
     * from the lead detail page; disabled in the UI when the lead has no
     * email. Audit-logged.
     */
    public function sendTrackerLink($id)
    {
        $lead = Lead::findOrFail($id);

        if (empty($lead->email)) {
            return back()->with('error', 'This lead has no email address on file.');
        }

        try {
            \Illuminate\Support\Facades\Mail::to($lead->email)->send(new \App\Mail\TrackerWelcome($lead));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Manual TrackerWelcome failed', ['lead_id' => $lead->id, 'error' => $e->getMessage()]);
            return back()->with('error', 'Could not send the tracker link. Please try again.');
        }

        \App\Models\ActivityLog::record('lead.tracker_link_sent', [
            'entity_type' => Lead::class,
            'entity_id'   => $lead->id,
            'description' => "Tracker link emailed to {$lead->email}",
        ]);

        return back()->with('success', "Tracker link sent to {$lead->email}.");
    }

    /**
     * Update the INZ tracking fields on a lead — visa type, lodgement date,
     * INZ reference number, current status, decision date.
     */
    public function updateInz(\Illuminate\Http\Request $request, $id)
    {
        $validated = $request->validate([
            'inz_visa_type'   => 'nullable|string|max:120',
            'inz_lodged_at'   => 'nullable|date',
            'inz_reference'   => 'nullable|string|max:60',
            'inz_status'      => ['nullable', \Illuminate\Validation\Rule::in([
                'Lodged', 'Info Requested', 'Decision Pending', 'Approved', 'Declined', 'Withdrawn',
            ])],
            'inz_decision_at' => 'nullable|date',
        ]);

        try {
            $lead = Lead::findOrFail($id);
            $lead->fill($validated)->save();
            return back()->with('success', 'INZ tracking updated.');
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('INZ update failed', ['id' => $id, 'error' => $e->getMessage()]);
            return back()->with('error', 'Could not update INZ tracking.');
        }
    }

    public function revertStudent($id)
    {
        try {
            $lead = Lead::findOrFail($id);
            $lead->fill([
                'is_student'           => false,
                'student_converted_at' => null,
                'student_converted_by' => null,
            ])->save();
            return back()->with('success', "Lead {$lead->lead_id} reverted to non-student.");
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Revert student failed', ['id' => $id, 'error' => $e->getMessage()]);
            return back()->with('error', 'Could not revert this conversion.');
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
