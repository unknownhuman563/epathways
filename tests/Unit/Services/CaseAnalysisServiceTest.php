<?php

namespace Tests\Unit\Services;

use App\Models\AiRecordAnalysis;
use App\Models\Lead;
use App\Models\User;
use App\Notifications\AiCriticalCaseAlert;
use App\Services\CaseAnalysisService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class CaseAnalysisServiceTest extends TestCase
{
    use RefreshDatabase;

    private function fake(string $content): void
    {
        Http::fake([
            'openrouter.ai/*' => Http::response([
                'choices' => [['message' => ['content' => $content]]],
                'usage'   => ['total_tokens' => 60],
                'model'   => 'google/gemini-2.5-flash',
            ], 200),
        ]);
    }

    private function makeCase(array $attrs = []): Lead
    {
        return Lead::create(array_merge([
            'first_name'          => 'Hone',
            'last_name'           => 'Williams',
            'is_immigration_case' => true,
            'inz_visa_type'       => 'Skilled Migrant Category',
            'inz_reference'       => 'INZ-99887',
        ], $attrs));
    }

    public function test_builds_prompt_with_case_data(): void
    {
        $this->fake(json_encode(['health' => 'warm', 'summary' => 'ok']));
        $case = $this->makeCase();

        app(CaseAnalysisService::class)->analyze($case);

        Http::assertSent(function ($request) {
            $payload = json_encode($request->data()['messages'] ?? []);
            return str_contains($payload, 'Skilled Migrant Category')
                && str_contains($payload, 'INZ-99887')
                && str_contains($payload, 'compliance analyst'); // case prompt, not lead prompt
        });
    }

    public function test_parses_valid_json_health(): void
    {
        $this->fake(json_encode(['health' => 'critical', 'summary' => 'Deadline missed.', 'score' => 20]));
        $case = $this->makeCase(['assigned_to' => User::factory()->create(['role' => 'immigration'])->id]);

        Notification::fake();
        $analysis = app(CaseAnalysisService::class)->analyze($case);

        $this->assertSame('critical', $analysis->health);
        $this->assertSame(20, $analysis->score);
    }

    public function test_handles_malformed_json_as_unknown(): void
    {
        $this->fake('I am not going to give legal advice and cannot output JSON.');
        $case = $this->makeCase();

        $analysis = app(CaseAnalysisService::class)->analyze($case);

        $this->assertSame('unknown', $analysis->health);
    }

    public function test_uses_cache_when_fresh(): void
    {
        $this->fake(json_encode(['health' => 'warm', 'summary' => 'Awaiting docs.']));
        $case = $this->makeCase();

        $svc = app(CaseAnalysisService::class);
        $a = $svc->analyze($case);
        $b = $svc->analyze($case);

        $this->assertSame($a->id, $b->id);
        $this->assertSame(1, AiRecordAnalysis::count());
        Http::assertSentCount(1);
    }

    public function test_creates_critical_alert_only_on_critical_health(): void
    {
        Notification::fake();
        $consultant = User::factory()->create(['role' => 'immigration']);
        $svc = app(CaseAnalysisService::class);

        // Two analyses, two responses in order (re-faking the same URL pattern
        // doesn't override — first stub wins — so use a sequence).
        $envelope = fn (array $json) => [
            'choices' => [['message' => ['content' => json_encode($json)]]],
            'usage'   => ['total_tokens' => 10],
            'model'   => 'google/gemini-2.5-flash',
        ];
        Http::fake([
            'openrouter.ai/*' => Http::sequence()
                ->push($envelope(['health' => 'warm', 'summary' => 'No urgent issue.']))
                ->push($envelope(['health' => 'critical', 'summary' => 'Visa expires in 2 days.'])),
        ]);

        // Non-critical → no notification.
        $svc->analyze($this->makeCase(['assigned_to' => $consultant->id]));
        Notification::assertNothingSent();

        // Critical → notifies the assigned consultant.
        $svc->analyze($this->makeCase(['assigned_to' => $consultant->id]));
        Notification::assertSentTo($consultant, AiCriticalCaseAlert::class);
    }
}
