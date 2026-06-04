<?php

namespace App\Http\Controllers;

use App\Models\Assessment;
use App\Models\StudentIntake;
use App\Models\VisaType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StudentIntakeController extends Controller
{
    public function showForm()
    {
        return inertia('visa/StudentInterestPage');
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

            $intakeId = 'SI-' . strtoupper(uniqid());

            $intake = StudentIntake::create(array_merge($validated, [
                'intake_id' => $intakeId,
                'status'    => 'Submitted',
            ]));

            $visaType = VisaType::query()->where('code', 'STUDENT')->first()
                ?: VisaType::query()->where('category', 'Student')->first();

            $assessment = Assessment::create([
                'visa_type_id'         => $visaType?->id,
                'intakeable_type'      => StudentIntake::class,
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
            Log::error('Student intake storage failed', ['error' => $e->getMessage()]);
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
            'overseas_address'      => 'nullable|string',
            'email'                 => 'required|email|max:255',
            'phone'                 => 'required|string|max:40',
            'country_of_citizenship'=> 'nullable|string|max:120',
            'other_citizenships'    => 'nullable|string|max:255',
            'national_id'           => 'nullable|string|max:80',
            'passport_number'       => 'nullable|string|max:60',
            'passport_expiry'       => 'nullable|date',
            'partnership_status'    => 'nullable|string|max:60',

            'current_country'         => 'nullable|string|max:120',
            'previous_nz_visas'       => 'nullable|array',
            'previous_nzeta'          => 'nullable|array',
            'australian_pr'           => 'nullable|array',
            'travelled_nz'            => 'nullable|string|max:10',
            'last_nz_departure'       => 'nullable|date',
            'over_24_months'          => 'nullable|string|max:10',

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

            'qualifications'  => 'nullable|array',

            'currently_working'         => 'nullable|string|max:10',
            'current_job_title'         => 'nullable|string|max:255',
            'current_job_duties'        => 'nullable|string',
            'current_job_start'         => 'nullable|date',
            'current_job_finish'        => 'nullable|date',
            'current_job_country'       => 'nullable|string|max:120',
            'current_job_region'        => 'nullable|string|max:120',
            'current_employer_name'     => 'nullable|string|max:255',
            'current_employer_address'  => 'nullable|string',
            'current_employer_phone'    => 'nullable|string|max:60',
            'current_employer_email'    => 'nullable|email|max:255',

            'family_members'   => 'nullable|array',
            'has_nz_contacts'  => 'nullable|string|max:10',
            'nz_contacts'      => 'nullable|array',

            'military_compulsory'  => 'nullable|string|max:10',
            'military_undertaken'  => 'nullable|string|max:10',
            'military_details'     => 'nullable|string',

            'travelled_internationally' => 'nullable|string|max:10',
            'travel_trips'              => 'nullable|array',

            'programmes'         => 'nullable|string',
            'study_period_from'  => 'nullable|date',
            'study_period_to'    => 'nullable|date',
            'school_name'        => 'nullable|string|max:255',
            'has_offer'          => 'nullable|string|max:10',

            'has_enough_funds'         => 'nullable|string|max:10',
            'tuition_fee_nzd'          => 'nullable|numeric|min:0',
            'available_funds'          => 'nullable|array',
            'living_expenses_nzd'      => 'nullable|numeric|min:0',
            'has_sponsor'              => 'nullable|string|max:10',
            'sponsor_relationship'     => 'nullable|string|max:120',
            'sponsor_income_source'    => 'nullable|string|max:255',
            'can_provide_statements'   => 'nullable|string|max:10',
            'has_other_assets'         => 'nullable|string|max:10',
            'other_assets_details'     => 'nullable|string',

            'declaration_accepted'  => 'required|accepted',
            'signature_name'        => 'nullable|string|max:255',
            'signature_date'        => 'nullable|date',
        ];
    }
}
