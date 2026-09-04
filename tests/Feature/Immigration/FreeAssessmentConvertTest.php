<?php

namespace Tests\Feature\Immigration;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A free assessment (a Lead with an AI eligibility score, no intake) can be
 * converted straight to an immigration case from the assessments module — the
 * /free-assessment funnel is an immigration enquiry.
 */
class FreeAssessmentConvertTest extends TestCase
{
    use RefreshDatabase;

    public function test_free_assessment_converts_to_case(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'immigration']));

        $lead = Lead::create(['first_name' => 'Free', 'last_name' => 'Assess', 'email' => 'free@example.com']);
        $this->assertFalse((bool) $lead->is_immigration_case);

        $this->post("/portal/immigration/assessments/{$lead->id}/convert-to-case", [
            'intake_type' => 'free',
            'intake_id' => $lead->id,
        ])->assertRedirect("/portal/immigration/cases/{$lead->id}/profile?tab=documents");

        $lead->refresh();
        $this->assertTrue((bool) $lead->is_immigration_case);
        $this->assertNotNull($lead->immigration_converted_at);
    }

    public function test_free_convert_is_idempotent(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'immigration']));

        $lead = Lead::create([
            'first_name' => 'Already', 'last_name' => 'Case', 'email' => 'a@example.com',
            'is_immigration_case' => true, 'immigration_converted_at' => now()->subDay(),
        ]);
        $firstConvertedAt = $lead->immigration_converted_at;

        $this->post("/portal/immigration/assessments/{$lead->id}/convert-to-case", [
            'intake_type' => 'free', 'intake_id' => $lead->id,
        ])->assertRedirect();

        $lead->refresh();
        // Re-run preserves the original conversion timestamp.
        $this->assertTrue($firstConvertedAt->equalTo($lead->immigration_converted_at));
    }
}
