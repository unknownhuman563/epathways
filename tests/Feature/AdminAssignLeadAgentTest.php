<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Admin can assign / clear a lead's recruiting agent from the Edit Lead modal
 * on /admin/leads (the picker now works outside the sales portal).
 */
class AdminAssignLeadAgentTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_assign_and_clear_a_leads_agent(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $agent = User::factory()->create(['role' => 'agent']);
        $lead = Lead::create(['first_name' => 'A', 'last_name' => 'B', 'email' => 'a@b.com']);

        $this->actingAs($admin)
            ->post("/admin/leads/{$lead->id}/agent", ['agent_id' => $agent->id])
            ->assertRedirect();
        $this->assertSame($agent->id, $lead->refresh()->agent_id);

        $this->actingAs($admin)
            ->post("/admin/leads/{$lead->id}/agent", ['agent_id' => null])
            ->assertRedirect();
        $this->assertNull($lead->refresh()->agent_id);
    }

    public function test_non_agent_user_is_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $notAgent = User::factory()->create(['role' => 'education']);
        $lead = Lead::create(['first_name' => 'A', 'last_name' => 'B', 'email' => 'a@b.com']);

        $this->actingAs($admin)
            ->post("/admin/leads/{$lead->id}/agent", ['agent_id' => $notAgent->id])
            ->assertSessionHasErrors('agent_id');
        $this->assertNull($lead->refresh()->agent_id);
    }
}
