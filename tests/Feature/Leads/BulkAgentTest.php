<?php

namespace Tests\Feature\Leads;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The admin Leads page reuses the sales table with portalBase=/admin, so its
 * bulk "Set/edit agent" posts to /admin/leads/bulk-agent — a route that was
 * missing (only the portal prefixes had it), so the action silently no-oped.
 */
class BulkAgentTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_bulk_assign_agent_sets_the_agent(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $agent = User::factory()->create(['role' => 'agent']);
        $a = Lead::create(['first_name' => 'A', 'last_name' => 'L', 'status' => 'New Leads']);
        $b = Lead::create(['first_name' => 'B', 'last_name' => 'L', 'status' => 'New Leads']);

        $this->post('/admin/leads/bulk-agent', ['lead_ids' => [$a->id, $b->id], 'agent_id' => $agent->id])
            ->assertRedirect();

        $this->assertSame($agent->id, $a->fresh()->agent_id);
        $this->assertSame($agent->id, $b->fresh()->agent_id);
    }

    public function test_admin_bulk_clear_agent_with_null(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $agent = User::factory()->create(['role' => 'agent']);
        $lead = Lead::create(['first_name' => 'A', 'last_name' => 'L', 'status' => 'New Leads', 'agent_id' => $agent->id]);

        $this->post('/admin/leads/bulk-agent', ['lead_ids' => [$lead->id], 'agent_id' => null])
            ->assertRedirect();

        $this->assertNull($lead->fresh()->agent_id);
    }
}
