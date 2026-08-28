<?php

namespace Tests\Feature\Admin;

use App\Models\AgentAgreement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AgentModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_view_agents_index(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'super_admin']))
            ->get('/admin/agents')
            ->assertOk();
    }

    public function test_ungranted_admin_is_blocked_from_agents(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->get('/admin/agents')
            ->assertForbidden();
    }

    public function test_granted_admin_can_view_agents(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'module_permissions' => ['agents']]);

        $this->actingAs($admin)->get('/admin/agents')->assertOk();
    }

    public function test_generate_agreement_creates_a_record_and_file(): void
    {
        Storage::fake('local');
        $super = User::factory()->create(['role' => 'super_admin']);
        $agent = User::factory()->create(['role' => 'agent', 'name' => 'Lillian Ejorango']);

        $this->actingAs($super)
            ->post("/admin/agents/{$agent->id}/agreement/generate", [
                'agent_passport' => 'AK341265',
                'agent_citizenship' => 'Canada',
                'nz_6plus_rate' => 'PhP 35,000',
            ])
            ->assertRedirect();

        $agreement = AgentAgreement::where('agent_id', $agent->id)->first();
        $this->assertNotNull($agreement);
        $this->assertSame('AK341265', $agreement->fields['agent_passport']);
        $this->assertSame('PhP 35,000', $agreement->fields['nz_6plus_rate']);
        Storage::disk('local')->assertExists($agreement->file_path);
    }

    public function test_regenerating_replaces_the_previous_agreement(): void
    {
        Storage::fake('local');
        $super = User::factory()->create(['role' => 'super_admin']);
        $agent = User::factory()->create(['role' => 'agent']);

        $this->actingAs($super)->post("/admin/agents/{$agent->id}/agreement/generate", ['agent_passport' => 'A1']);
        $this->actingAs($super)->post("/admin/agents/{$agent->id}/agreement/generate", ['agent_passport' => 'B2']);

        $this->assertSame(1, AgentAgreement::where('agent_id', $agent->id)->count());
        $this->assertSame('B2', AgentAgreement::where('agent_id', $agent->id)->first()->fields['agent_passport']);
    }

    public function test_show_404s_for_a_non_agent_user(): void
    {
        $super = User::factory()->create(['role' => 'super_admin']);
        $notAgent = User::factory()->create(['role' => 'sales']);

        $this->actingAs($super)->get("/admin/agents/{$notAgent->id}")->assertNotFound();
    }
}
