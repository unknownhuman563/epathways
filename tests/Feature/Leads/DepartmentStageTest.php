<?php

namespace Tests\Feature\Leads;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The lead-profile header is department-aware: a lead moved to Study edits its
 * education_stage (not the sales `status`), matching the Students list.
 */
class DepartmentStageTest extends TestCase
{
    use RefreshDatabase;

    public function test_education_stage_update_targets_the_right_column(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'education']));
        $lead = Lead::create([
            'first_name' => 'F', 'last_name' => 'O', 'status' => 'English Pro', 'is_student' => true,
        ]);

        $this->post("/admin/leads/{$lead->id}/stage", ['status' => 'Endorsed to School', 'field' => 'education_stage'])
            ->assertRedirect();

        $fresh = $lead->fresh();
        $this->assertSame('Endorsed to School', $fresh->education_stage);
        $this->assertSame('English Pro', $fresh->status, 'sales status must be untouched');
    }

    public function test_sales_status_update_still_works_by_default(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $lead = Lead::create(['first_name' => 'A', 'last_name' => 'L', 'status' => 'New Leads']);

        $this->post("/admin/leads/{$lead->id}/stage", ['status' => 'Proposal Sent'])
            ->assertRedirect();

        $this->assertSame('Proposal Sent', $lead->fresh()->status);
    }

    public function test_invalid_value_for_department_field_is_rejected(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'education']));
        $lead = Lead::create(['first_name' => 'A', 'last_name' => 'L', 'status' => 'New Leads', 'is_student' => true]);

        // "Qualified" is a sales stage, not an education stage.
        $this->post("/admin/leads/{$lead->id}/stage", ['status' => 'Qualified', 'field' => 'education_stage'])
            ->assertSessionHasErrors('status');
    }

    public function test_education_handoff_stage_auto_promotes_to_immigration(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $lead = Lead::create([
            'first_name' => 'A', 'last_name' => 'L', 'status' => 'New Leads',
            'is_student' => true, 'is_immigration_case' => false,
        ]);

        $this->post("/admin/leads/{$lead->id}/stage", ['status' => 'Endorsed to Immigration', 'field' => 'education_stage'])
            ->assertRedirect();

        $fresh = $lead->fresh();
        $this->assertTrue((bool) $fresh->is_immigration_case);
        $this->assertFalse((bool) $fresh->is_student);
    }
}
