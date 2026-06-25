<?php

namespace Tests\Feature\Ai;

use App\Models\AiRecordAnalysis;
use App\Models\Lead;
use App\Models\User;
use App\Notifications\AiCriticalLeadAlert;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class LeadAnalysisTest extends TestCase
{
    use RefreshDatabase;

    private function fakeAnalysis(array $json): void
    {
        Http::fake([
            'openrouter.ai/*' => Http::response([
                'choices' => [['message' => ['content' => json_encode($json)]]],
                'usage'   => ['total_tokens' => 88],
                'model'   => 'google/gemini-2.5-flash',
            ], 200),
        ]);
    }

    public function test_analysis_is_cached_and_not_reanalysed(): void
    {
        $this->fakeAnalysis(['health' => 'warm', 'summary' => 'Shown interest.', 'score' => 60]);
        $admin = User::factory()->create(['role' => 'admin']);
        $lead = Lead::create(['first_name' => 'Cache', 'last_name' => 'Me']);

        $first  = $this->actingAs($admin)->getJson("/api/ai/leads/{$lead->id}/analysis")->assertOk();
        $second = $this->actingAs($admin)->getJson("/api/ai/leads/{$lead->id}/analysis")->assertOk();

        $this->assertSame($first->json('analysis.id'), $second->json('analysis.id'));
        $this->assertSame(1, AiRecordAnalysis::count());
        Http::assertSentCount(1); // only the first call hit the model
    }

    public function test_force_refresh_creates_a_new_analysis(): void
    {
        $this->fakeAnalysis(['health' => 'warm', 'summary' => 'Interested.']);
        $admin = User::factory()->create(['role' => 'admin']);
        $lead = Lead::create(['first_name' => 'Fresh', 'last_name' => 'One']);

        $this->actingAs($admin)->getJson("/api/ai/leads/{$lead->id}/analysis")->assertOk();
        $this->actingAs($admin)->postJson("/api/ai/leads/{$lead->id}/analysis/refresh")->assertOk();

        $this->assertSame(2, AiRecordAnalysis::count());
    }

    public function test_critical_health_notifies_the_assigned_staff(): void
    {
        Notification::fake();
        $this->fakeAnalysis(['health' => 'critical', 'summary' => 'About to be lost.', 'recommendations' => ['Call now']]);
        $assignee = User::factory()->create(['role' => 'sales']);
        $admin = User::factory()->create(['role' => 'admin']);
        $lead = Lead::create(['first_name' => 'Hot', 'last_name' => 'Lead', 'assigned_to' => $assignee->id]);

        $this->actingAs($admin)->getJson("/api/ai/leads/{$lead->id}/analysis")->assertOk();

        Notification::assertSentTo($assignee, AiCriticalLeadAlert::class);
    }

    public function test_non_critical_health_does_not_notify(): void
    {
        Notification::fake();
        $this->fakeAnalysis(['health' => 'warm', 'summary' => 'Needs follow-up.']);
        $assignee = User::factory()->create(['role' => 'sales']);
        $admin = User::factory()->create(['role' => 'admin']);
        $lead = Lead::create(['first_name' => 'Mild', 'last_name' => 'Lead', 'assigned_to' => $assignee->id]);

        $this->actingAs($admin)->getJson("/api/ai/leads/{$lead->id}/analysis")->assertOk();

        Notification::assertNothingSent();
    }

    public function test_sales_staff_cannot_analyse_an_immigration_lead(): void
    {
        $this->fakeAnalysis(['health' => 'warm', 'summary' => 'x']);
        $sales = User::factory()->create(['role' => 'sales']);
        $immigrationLead = Lead::create(['first_name' => 'Visa', 'last_name' => 'Case', 'is_immigration_case' => true]);

        $this->actingAs($sales)->getJson("/api/ai/leads/{$immigrationLead->id}/analysis")->assertForbidden();
    }

    public function test_immigration_staff_can_analyse_an_immigration_lead(): void
    {
        $this->fakeAnalysis(['health' => 'hot', 'summary' => 'Engaged.']);
        $immigration = User::factory()->create(['role' => 'immigration']);
        $lead = Lead::create(['first_name' => 'Visa', 'last_name' => 'Case', 'is_immigration_case' => true]);

        $this->actingAs($immigration)->getJson("/api/ai/leads/{$lead->id}/analysis")
            ->assertOk()->assertJsonPath('analysis.health', 'hot');
    }

    public function test_disabled_ai_returns_disabled_payload(): void
    {
        config(['ai.enabled' => false]);
        $admin = User::factory()->create(['role' => 'admin']);
        $lead = Lead::create(['first_name' => 'Off', 'last_name' => 'Air']);

        $this->actingAs($admin)->getJson("/api/ai/leads/{$lead->id}/analysis")
            ->assertOk()->assertJsonPath('ai_disabled', true);
        $this->assertSame(0, AiRecordAnalysis::count());
    }
}
