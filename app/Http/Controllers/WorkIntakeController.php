<?php

namespace App\Http\Controllers;

use App\Models\Assessment;
use App\Models\VisaType;
use App\Models\WorkIntake;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * AEWV (Accredited Employer Work Visa) intake controller. Mirrors
 * ResidentIntakeController's submit-then-wrap-in-Assessment pattern.
 */
class WorkIntakeController extends Controller
{
    public function showForm()
    {
        return inertia('visa/WorkInterestPage');
    }

    public function store(Request $request)
    {
        // Inertia ships untouched empty inputs as "" rather than null, which
        // makes `nullable|email` / `nullable|date` rules fail on otherwise
        // optional fields. Convert all empty scalars to null up front so
        // `nullable` does what the rule name says it does.
        $request->merge(collect($request->all())
            ->map(fn ($v) => is_string($v) && trim($v) === '' ? null : $v)
            ->all());

        $validated = $request->validate($this->rules());

        try {
            DB::beginTransaction();

            $intakeId = 'WI-' . strtoupper(uniqid());

            $intake = WorkIntake::create(array_merge($validated, [
                'intake_id' => $intakeId,
                'status'    => 'New',
            ]));

            $visaType = VisaType::query()->where('code', 'WORK_AEWV')->first()
                ?: VisaType::query()->where('category', 'Work')->first();

            $assessment = Assessment::create([
                'visa_type_id'         => $visaType?->id,
                'intakeable_type'      => WorkIntake::class,
                'intakeable_id'        => $intake->id,
                'applicant_first_name' => $intake->first_name,
                'applicant_last_name'  => $intake->family_name,
                'applicant_email'      => $intake->email,
                'applicant_phone'      => $intake->phone,
                'status'               => 'submitted',
            ]);
            if ($visaType) {
                $assessment->lockCurrentPrice();
            }

            DB::commit();

            return redirect()->route('assessment.pay', $assessment->token);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Work intake storage failed', ['error' => $e->getMessage()]);
            return redirect()->back()->withErrors([
                'error' => 'Failed to submit intake. Please try again.',
            ]);
        }
    }

    private function rules(): array
    {
        return [
            'family_name'           => 'required|string|max:255',
            'first_name'            => 'required|string|max:255',
            'other_names'           => 'nullable|string|max:255',
            'gender'                => 'nullable|string|max:30',
            'dob'                   => 'required|date',
            'country_of_birth'      => 'nullable|string|max:120',
            'place_of_birth'        => 'nullable|string|max:120',
            'current_address'       => 'nullable|string',
            'email'                 => 'required|email|max:255',
            'phone'                 => 'required|string|max:40',
            'country_of_citizenship'=> 'nullable|string|max:120',
            'other_citizenships'    => 'nullable|string|max:255',
            'national_id'           => 'nullable|string|max:80',
            'partnership_status'    => 'nullable|string|max:60',

            'current_country'             => 'nullable|string|max:120',
            'previous_nz_visa'            => 'nullable|string|max:10',
            'previous_nz_visa_details'    => 'nullable|string',
            'previous_nzeta'              => 'nullable|string|max:10',
            'australian_pr'               => 'nullable|string|max:10',
            'travelled_nz'                => 'nullable|string|max:10',
            'last_nz_departure'           => 'nullable|date',
            'over_24_months'              => 'nullable|string|max:10',

            'employer_name'               => 'nullable|string|max:255',
            'employer_is_family'          => 'nullable|string|max:10',
            'employer_family_relation'    => 'nullable|string|max:120',
            'self_employed'               => 'nullable|string|max:10',
            'job_start_date'              => 'nullable|date',
            'hourly_rate'                 => 'nullable|numeric|min:0',
            'supports_dependent_children' => 'nullable|string|max:10',

            'character_convicted'         => 'nullable|string|max:10',
            'character_investigation'     => 'nullable|string|max:10',
            'character_deported'          => 'nullable|string|max:10',
            'character_visa_refused'      => 'nullable|string|max:10',
            'lived_other_country_5y'      => 'nullable|string|max:10',
            'lived_other_country_details' => 'nullable|string',

            'health_tb'           => 'nullable|string|max:10',
            'health_renal'        => 'nullable|string|max:10',
            'health_hospital'     => 'nullable|string|max:10',
            'health_residential'  => 'nullable|string|max:10',
            'health_pregnant'     => 'nullable|string|max:10',

            'currently_working'         => 'nullable|string|max:10',
            'current_job_title'         => 'nullable|string|max:255',
            'current_job_duties'        => 'nullable|string',
            'current_job_start'         => 'nullable|date',
            'current_job_country'       => 'nullable|string|max:120',
            'current_job_region'        => 'nullable|string|max:120',
            'current_employer_name'     => 'nullable|string|max:255',
            'current_employer_address'  => 'nullable|string',
            'current_employer_phone'    => 'nullable|string|max:60',
            'current_employer_email'    => 'nullable|email|max:255',

            'previous_roles'   => 'nullable|array',
            'family_members'   => 'nullable|array',
            'has_nz_contacts'  => 'nullable|string|max:10',
            'nz_contacts'      => 'nullable|array',

            'military_compulsory'    => 'nullable|string|max:10',
            'military_undertaken'    => 'nullable|string|max:10',
            'military_details'       => 'nullable|string',

            'travelled_internationally' => 'nullable|string|max:10',
            'travel_trips'              => 'nullable|array',

            'declaration_accepted'  => 'required|accepted',
            'signature_name'        => 'nullable|string|max:255',
            'signature_date'        => 'nullable|date',
        ];
    }
}
