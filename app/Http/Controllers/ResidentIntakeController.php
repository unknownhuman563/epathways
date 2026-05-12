<?php

namespace App\Http\Controllers;

use App\Models\ResidentIntake;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ResidentIntakeController extends Controller
{
    /**
     * Show the public Resident Intake form.
     */
    public function showForm()
    {
        return inertia('visa/ResidentIntakePage');
    }

    /**
     * Store a submitted Resident Intake.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'terms_accepted'           => 'required|accepted',

            'first_name'               => 'required|string|max:255',
            'last_name'                => 'required|string|max:255',
            'dob'                      => 'required|date',
            'nationality'              => 'required|string|max:120',
            'email'                    => 'required|email|max:255',
            'phone'                    => 'required|string|max:25',

            'passport_number'          => 'required|string|max:60',
            'passport_expiry'          => 'required|date',
            'issuing_country'          => 'required|string|max:120',

            'current_visa_type'        => 'required|in:AEWV,Essential Skills,Work to Residence,Other',
            'current_visa_other'       => 'nullable|required_if:current_visa_type,Other|string|max:255',
            'current_visa_expiry'      => 'required|date',
            'nz_arrival_date'          => 'required|date',
            'previous_nz_visa_history' => 'nullable|string',

            'job_title'                => 'required|string|max:255',
            'employment_start'         => 'required|date',
            'employment_type'          => 'required|string|max:120',
            'hourly_rate'              => 'required|numeric|min:0',

            'highest_qualification'    => 'required|string|max:120',
            'institution_name'         => 'nullable|string|max:255',
            'country_of_study'         => 'nullable|string|max:120',
            'nzqa_status'              => 'nullable|string|max:120',
            'nzqa_iqa_reference'       => 'nullable|required_if:nzqa_status,Yes — IQA completed|string|max:60',

            'nz_skilled_years'         => 'required|numeric|min:0',
            'total_skilled_years'      => 'required|numeric|min:0',
            'career_summary'           => 'nullable|string',

            'english_evidence'         => 'required|string|max:120',
            'english_test_score'       => 'nullable|required_if:english_evidence,IELTS|required_if:english_evidence,TOEFL|required_if:english_evidence,PTE Academic|string|max:30',
            'english_test_date'        => 'nullable|required_if:english_evidence,IELTS|required_if:english_evidence,TOEFL|required_if:english_evidence,PTE Academic|date',

            'include_family'           => 'required|string|max:60',
            'family_members'           => 'nullable|array',
            'family_members.*.full_name'        => 'nullable|required_with:family_members.*.relationship|string|max:255',
            'family_members.*.relationship'     => 'nullable|in:Spouse / partner,Dependent child',
            'family_members.*.dob'              => 'nullable|date',
            'family_members.*.passport_number'  => 'nullable|string|max:60',

            'documents'                => 'nullable|array',

            'character_health_disclosure' => 'nullable|string',
            'other_notes'                 => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $intake = ResidentIntake::create(array_merge(
                $validated,
                [
                    'intake_id' => 'RI-' . strtoupper(uniqid()),
                    'status'    => 'New',
                ]
            ));

            DB::commit();

            return redirect()->back()->with([
                'success'   => true,
                'intake_id' => $intake->intake_id,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Resident intake storage failed', ['error' => $e->getMessage()]);
            return redirect()->back()->withErrors([
                'error' => 'Failed to submit intake. Please try again.',
            ]);
        }
    }

    /**
     * Admin: list all resident intakes.
     */
    public function adminIndex()
    {
        $intakes = ResidentIntake::latest()->get();
        return inertia('admin/Immigration/ResidentIntakes', [
            'intakes' => $intakes,
        ]);
    }

    /**
     * Admin: show a single intake.
     */
    public function adminShow($id)
    {
        $intake = ResidentIntake::findOrFail($id);
        return inertia('admin/Immigration/ResidentIntakeDetails', [
            'intake' => $intake,
        ]);
    }
}
