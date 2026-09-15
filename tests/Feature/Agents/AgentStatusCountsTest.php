<?php

namespace Tests\Feature\Agents;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AgentStatusCountsTest extends TestCase
{
    use RefreshDatabase;

    public function test_agent_profile_counts_leads_by_effective_stage(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $agent = User::factory()->create(['role' => 'agent', 'name' => 'Tania Chand']);

        // Two "Proposal Sent" (sales status), one "Program Selected", and one
        // whose education stage overrides the sales status.
        Lead::create(['first_name' => 'A', 'last_name' => 'A', 'tracking_code' => 'AG1', 'agent_id' => $agent->id, 'status' => 'Proposal Sent']);
        Lead::create(['first_name' => 'B', 'last_name' => 'B', 'tracking_code' => 'AG2', 'agent_id' => $agent->id, 'status' => 'Proposal Sent']);
        Lead::create(['first_name' => 'C', 'last_name' => 'C', 'tracking_code' => 'AG3', 'agent_id' => $agent->id, 'status' => 'Program Selected']);
        Lead::create(['first_name' => 'D', 'last_name' => 'D', 'tracking_code' => 'AG4', 'agent_id' => $agent->id, 'status' => 'New Leads', 'education_stage' => 'Started Course']);

        $this->actingAs($admin)->get("/admin/agents/{$agent->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->component('admin/agents/Show')
                ->where('statusCounts', fn ($counts) => collect($counts)->firstWhere('status', 'Proposal Sent')['count'] === 2
                    && collect($counts)->firstWhere('status', 'Program Selected')['count'] === 1
                    && collect($counts)->firstWhere('status', 'Started Course')['count'] === 1
                )
            );
    }
}
