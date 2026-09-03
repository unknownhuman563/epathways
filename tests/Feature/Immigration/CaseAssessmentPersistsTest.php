<?php

namespace Tests\Feature\Immigration;

use App\Models\Assessment;
use App\Models\FamilyIntake;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A case's original assessment must stay visible even after the visa type is
 * changed, and even when a newer but unresolvable submission exists for the same
 * client — resolveIntake must fall back to the newest *valid* candidate.
 */
class CaseAssessmentPersistsTest extends TestCase
{
    use RefreshDatabase;

    public function test_partner_assessment_survives_a_broken_newer_one_and_a_visa_change(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $visa = \App\Models\VisaType::create(['name' => 'Family Visa', 'code' => 'FAMTEST']);

        $lead = Lead::create([
            'first_name' => 'Kevin', 'last_name' => 'Cardiff',
            'email' => 'kevin@example.com', 'is_immigration_case' => true,
            'inz_visa_type' => 'Accredited Employer Work Visa', // already switched to work
        ]);

        // The real partner/family assessment the client completed.
        $family = FamilyIntake::create([
            'intake_id' => 'FAM-TEST-1',
            'first_name' => 'Kevin', 'family_name' => 'Cardiff',
            'email' => 'kevin@example.com', 'phone' => '021000000', 'status' => 'Submitted',
        ]);
        $good = Assessment::create([
            'applicant_first_name' => 'Kevin', 'applicant_last_name' => 'Cardiff',
            'applicant_email' => 'kevin@example.com', 'visa_type_id' => $visa->id,
            'intakeable_type' => FamilyIntake::class, 'intakeable_id' => $family->id,
            'status' => 'completed',
        ]);
        $lead->forceFill(['assessment_id' => $good->id])->save();

        // A NEWER assessment for the same client whose intake row is gone —
        // the "newest wins" bug would return null here and hide the good one.
        Assessment::create([
            'applicant_first_name' => 'Kevin', 'applicant_last_name' => 'Cardiff',
            'applicant_email' => 'kevin@example.com', 'visa_type_id' => $visa->id,
            'intakeable_type' => \App\Models\WorkIntake::class, 'intakeable_id' => 999999,
            'status' => 'draft',
        ]);

        $this->actingAs($admin)->get("/portal/immigration/cases/{$lead->id}/profile")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('intake.type', 'family')
                ->where('intake.data.assessment_id', $good->id));
    }
}
