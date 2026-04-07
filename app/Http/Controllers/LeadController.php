<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Http\Requests\StoreLeadRequest;
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
        return inertia('Admin/Leads', [
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
        return inertia('FreeAssessment');
    }

    /**
     * Store a free assessment submission.
     */
    public function storeFreeAssessment(\Illuminate\Http\Request $request)
    {
        // 1. Comprehensive Validation for Security
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:25',
            'terms_accepted' => 'required|accepted',
            'passport_pdf' => 'nullable|file|mimes:pdf|max:10240',

            // Nested validation - validate structure
            'study_plans' => 'nullable|array',
            'financial_info' => 'nullable|array',
            'education_background' => 'nullable|array',
            'work_experience' => 'nullable|array',
            'immigration_info' => 'nullable|array',
            'character_info' => 'nullable|array',
            'health_info' => 'nullable|array',
            'family_info' => 'nullable|array',
            'nz_contacts_info' => 'nullable|array',
            'military_info' => 'nullable|array',
            'source_of_funds_info' => 'nullable|array',
            'home_ties_info' => 'nullable|array',
            'declaration_accepted' => 'nullable',
        ]);

        try {
            DB::beginTransaction();

            $data = $request->all();
            
            // 2. Handle Passport Upload Securely
            $passportPath = null;
            if ($request->hasFile('passport_pdf')) {
                $passportPath = $request->file('passport_pdf')->store('passports', 'public');
            }

            // 3. Create Lead with Ternary Mapping for Security & Clarity
            $lead = Lead::create([
                'lead_id'           => 'FA-' . strtoupper(uniqid()),
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
            ]);

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

            return redirect()->back()->with('success', 'Your assessment profile has been securely analyzed.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Free assessment mapping failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return redirect()->back()->withErrors(['error' => 'Submission failed. Our team has been notified.']);
        }
    }

    /**
     * Display the specified lead.
     */
    public function show($id)
    {
        $lead = Lead::where('id', $id)
            ->orWhere('lead_id', $id)
            ->with(['studyPlans', 'educationExps', 'event'])
            ->firstOrFail();

        return inertia('Admin/LeadDetails', [
            'lead' => $lead
        ]);
    }
}
