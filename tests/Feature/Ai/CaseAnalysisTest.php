<?php

namespace Tests\Feature\Ai;

use App\Models\AiRecordAnalysis;
use App\Models\Lead;
use App\Models\User;
use App\Notifications\AiCriticalCaseAlert;
use App\Services\CaseAnalysisService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class CaseAnalysisTest extends TestCase
{
    use RefreshDatabase;

    private function fakeAnalysis(array $json): void
    {
        Http::fake([
            'openrouter.ai/*' => Http::response([
                'choices' => [['message' => ['content' => json_encode($json)]]],
                'usage'   => ['total_tokens' => 77],
                'model'   => 'google/gemini-2.5-flash',
            ], 200),
        ]);
    }

    private function makeCase(array $attrs = []): Lead
    {
        return Lead::create(array_merge([
            'first_name'          => 'Visa',
            'last_name'           => 'Applicant',
            'is_immigration_case' => true,
            'inz_visa_type'       => 'Skilled Migrant Category',
            'inz_reference'       => 'INZ-12345',
        ], $attrs));
    }

    public function test_consultant_can_analyse_a_case(): void
    {
        $this->fakeAnalysis(['health' => 'warm', 'summary' => 'Awaiting police certificate.', 'score' => 55]);
        $consultant = User::factory()->create(['role' => 'immigration']);
        $case = $this->makeCase();

        $this->actingAs($consultant)->getJson("/api/ai/cases/{$case->id}/analysis")
            ->assertOk()->assertJsonPath('analysis.health', 'warm');
    }

    public function test_immigration_manager_and_adviser_can_analyse(): void
    {
        $this->fakeAnalysis(['health' => 'hot', 'summary' => 'On track.']);
        $case = $this->makeCase();

        $this->actingAs(User::factory()->create(['role' => 'immigration_manager']))
            ->getJson("/api/ai/cases/{$case->id}/analysis")->assertOk();
        $this->actingAs(User::factory()->create(['role' => 'immigration_adviser']))
            ->getJson("/api/ai/cases/{$case->id}/analysis")->assertOk();
    }

    public function test_sales_staff_cannot_analyse_a_case(): void
    {
        $this->fakeAnalysis(['health' => 'warm', 'summary' => 'x']);
        $case = $this->makeCase();

        $this->actingAs(User::factory()->create(['role' => 'sales']))
            ->getJson("/api/ai/cases/{$case->id}/analysis")->assertForbidden();
    }

    public function test_education_admin_cannot_analyse_a_case(): void
    {
        $this->fakeAnalysis(['health' => 'warm', 'summary' => 'x']);
        $case = $this->makeCase();

        $this->actingAs(User::factory()->create(['role' => 'education']))
            ->getJson("/api/ai/cases/{$case->id}/analysis")->assertForbidden();
    }

    public function test_english_teacher_cannot_analyse_a_case(): void
    {
        $this->fakeAnalysis(['health' => 'warm', 'summary' => 'x']);
        $case = $this->makeCase();

        $this->actingAs(User::factory()->create(['role' => 'english']))
            ->getJson("/api/ai/cases/{$case->id}/analysis")->assertForbidden();
    }

    public function test_admin_can_analyse_any_case(): void
    {
        $this->fakeAnalysis(['health' => 'cold', 'summary' => 'Stale — no consultant action in 30 days.']);
        $case = $this->makeCase();

        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->getJson("/api/ai/cases/{$case->id}/analysis")
            ->assertOk()->assertJsonPath('analysis.health', 'cold');
    }

    public function test_analysis_is_cached_for_24_hours(): void
    {
        $this->fakeAnalysis(['health' => 'warm', 'summary' => 'Awaiting docs.']);
        $admin = User::factory()->create(['role' => 'admin']);
        $case = $this->makeCase();

        $first  = $this->actingAs($admin)->getJson("/api/ai/cases/{$case->id}/analysis")->assertOk();
        $second = $this->actingAs($admin)->getJson("/api/ai/cases/{$case->id}/analysis")->assertOk();

        $this->assertSame($first->json('analysis.id'), $second->json('analysis.id'));
        $this->assertSame(1, AiRecordAnalysis::count());
        Http::assertSentCount(1);
    }

    public function test_force_refresh_creates_a_new_analysis(): void
    {
        $this->fakeAnalysis(['health' => 'warm', 'summary' => 'Awaiting docs.']);
        $admin = User::factory()->create(['role' => 'admin']);
        $case = $this->makeCase();

        $this->actingAs($admin)->getJson("/api/ai/cases/{$case->id}/analysis")->assertOk();
        $this->actingAs($admin)->postJson("/api/ai/cases/{$case->id}/analysis/refresh")->assertOk();

        $this->assertSame(2, AiRecordAnalysis::count());
    }

    public function test_critical_health_triggers_case_alert_notification(): void
    {
        Notification::fake();
        $this->fakeAnalysis(['health' => 'critical', 'summary' => 'Police certificate expires in 3 days.', 'recommendations' => ['Renew now']]);
        $consultant = User::factory()->create(['role' => 'immigration']);
        $case = $this->makeCase(['assigned_to' => $consultant->id]);

        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->getJson("/api/ai/cases/{$case->id}/analysis")->assertOk();

        Notification::assertSentTo($consultant, AiCriticalCaseAlert::class);
    }

    public function test_non_critical_health_does_not_notify(): void
    {
        Notification::fake();
        $this->fakeAnalysis(['health' => 'warm', 'summary' => 'No urgent issue.']);
        $consultant = User::factory()->create(['role' => 'immigration']);
        $case = $this->makeCase(['assigned_to' => $consultant->id]);

        $this->actingAs($consultant)->getJson("/api/ai/cases/{$case->id}/analysis")->assertOk();

        Notification::assertNothingSent();
    }

    public function test_disabled_ai_returns_disabled_payload(): void
    {
        config(['ai.enabled' => false]);
        $case = $this->makeCase();

        $this->actingAs(User::factory()->create(['role' => 'immigration']))
            ->getJson("/api/ai/cases/{$case->id}/analysis")
            ->assertOk()->assertJsonPath('ai_disabled', true);
        $this->assertSame(0, AiRecordAnalysis::count());
    }

    public function test_case_analysis_does_not_collide_with_lead_analysis(): void
    {
        // Same record gets a separate row per analysis flavour (sentinel type).
        $this->fakeAnalysis(['health' => 'warm', 'summary' => 'Case read.']);
        $admin = User::factory()->create(['role' => 'admin']);
        $case = $this->makeCase();

        $this->actingAs($admin)->getJson("/api/ai/leads/{$case->id}/analysis")->assertOk();
        $this->actingAs($admin)->getJson("/api/ai/cases/{$case->id}/analysis")->assertOk();

        $this->assertSame(1, AiRecordAnalysis::where('record_type', Lead::class)->count());
        $this->assertSame(1, AiRecordAnalysis::where('record_type', CaseAnalysisService::RECORD_TYPE)->count());
    }
}
