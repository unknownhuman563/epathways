<?php

namespace App\Http\Controllers;

use App\Models\Assessment;
use App\Models\FamilyIntake;
use App\Http\Controllers\Concerns\HandlesIntakeDocuments;
use App\Support\IntakeVisaTypeMap;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Public Family Visa (Partner or Child) assessment — the Family Visa Information
 * Form. Mirrors the other intake controllers.
 */
class FamilyIntakeController extends Controller
{
    use HandlesIntakeDocuments;

    public function showForm()
    {
        return inertia('visa/FamilyInterestPage');
    }

    public function store(Request $request)
    {
        // Inertia ships empty inputs as "" — normalise to null so `nullable` works.
        $request->merge(collect($request->all())
            ->map(fn ($v) => is_string($v) && trim($v) === '' ? null : $v)
            ->all());

        $validated = $request->validate($this->rules());

        try {
            DB::beginTransaction();

            $intakeId = 'FV-'.strtoupper(uniqid());

            // Document tab — files to the private disk, kept out of mass-assignment.
            unset($validated['document_files']);
            $storedFiles = $this->persistIntakeFiles($request, 'family-intakes', $intakeId);

            $intake = FamilyIntake::create(array_merge($validated, [
                'intake_id'      => $intakeId,
                'status'         => 'Submitted',
                'documents'      => ! empty($validated['documents']) ? $validated['documents'] : null,
                'document_files' => $storedFiles ?: null,
            ]));

            // Ensure the Family Visa type exists so the Assessment can attach.
            \App\Models\VisaType::firstOrCreate(
                ['code' => 'FAMILY'],
                ['name' => 'Family Visa (Partner / Child)', 'category' => 'Partnership', 'active' => true],
            );

            // Tracking Assessment row (payment/booking dormant like the others).
            $visaType = IntakeVisaTypeMap::resolve(FamilyIntake::class);
            if ($visaType) {
                Assessment::createForIntake($intake, $visaType);
            } else {
                Log::warning('VisaType not found for Family intake; Assessment skipped.', ['intake_id' => $intake->id]);
            }

            DB::commit();

            return back()->with('intake_submitted', 'Family Visa (Partner / Child)');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Family intake storage failed', ['error' => $e->getMessage()]);

            return redirect()->back()->withErrors(['error' => 'Failed to submit. Please try again.']);
        }
    }

    private function rules(): array
    {
        $yn = 'nullable|string|max:10';

        return [
            // Shared document-tab rules (passport, visa copies, files, …).
            ...$this->intakeDocumentRules(),
            // A — Identity
            'family_name' => 'required|string|max:255',
            'first_name' => 'required|string|max:255',
            'other_names' => 'nullable|string|max:255',
            'gender' => 'nullable|string|max:30',
            'dob' => 'required|date',
            'country_of_birth' => 'nullable|string|max:120',
            'place_of_birth' => 'nullable|string|max:120',
            'country_of_citizenship' => 'nullable|string|max:120',
            'other_citizenships' => 'nullable|string|max:255',
            'national_id' => 'nullable|string|max:80',
            'partnership_status' => 'nullable|string|max:60',
            // B — NZ immigration history
            'current_country' => 'nullable|string|max:120',
            'previous_nz_visa' => $yn,
            'current_address' => 'nullable|string',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:40',
            // C — Visa details
            'applying_as' => 'nullable|string|max:20',
            'visa_type' => 'nullable|string|max:120',
            'partner_living_together' => $yn,
            'partner_12_months' => $yn,
            'partner_same_period' => $yn,
            'partner_close_relatives' => $yn,
            'child_dependent' => $yn,
            // D — Character
            'character_convicted' => $yn,
            'character_removed' => $yn,
            'character_investigation' => $yn,
            'character_visa_refused' => $yn,
            'lived_other_country_5y' => $yn,
            'previous_police_certificate' => $yn,
            // E — Health
            'health_tb' => $yn,
            'health_renal' => $yn,
            'health_hospital' => $yn,
            'health_residential' => $yn,
            'health_pregnant' => $yn,
            'countries_visited_3m' => 'nullable|string|max:255',
            'previous_xray' => $yn,
            'previous_medical_cert' => $yn,
            // F — Work history
            'currently_working' => $yn,
            'current_employer_name' => 'nullable|string|max:255',
            'current_employer_address' => 'nullable|string',
            'current_employer_phone' => 'nullable|string|max:60',
            'current_employer_email' => 'nullable|string|max:255',
            'current_occupation' => 'nullable|string|max:255',
            'current_start' => 'nullable|string|max:40',
            'current_end' => 'nullable|string|max:40',
            'previous_work' => 'nullable|array',
            // G — Other contacts
            'nz_contacts' => 'nullable|string',
            // H — Declaration
            'declaration_accepted' => 'nullable|boolean',
            'signature_name' => 'nullable|string|max:255',
            'signature_date' => 'nullable|date',
            'terms_accepted' => 'nullable|boolean',
        ];
    }
}
