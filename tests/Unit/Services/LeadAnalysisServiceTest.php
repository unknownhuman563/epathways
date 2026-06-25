<?php

namespace Tests\Unit\Services;

use App\Models\AiRecordAnalysis;
use App\Models\Lead;
use App\Services\LeadAnalysisService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class LeadAnalysisServiceTest extends TestCase
{
    use RefreshDatabase;

    private function fake(string $content): void
    {
        Http::fake([
            'openrouter.ai/*' => Http::response([
                'choices' => [['message' => ['content' => $content]]],
                'usage'   => ['total_tokens' => 50],
                'model'   => 'google/gemini-2.5-flash',
            ], 200),
        ]);
    }

    public function test_builds_prompt_with_lead_data(): void
    {
        $this->fake(json_encode(['health' => 'warm', 'summary' => 'ok']));
        $lead = Lead::create(['first_name' => 'Johnny', 'last_name' => 'Appleseed', 'email' => 'johnny@example.com']);

        app(LeadAnalysisService::class)->analyze($lead);

        Http::assertSent(function ($request) {
            $payload = json_encode($request->data()['messages'] ?? []);
            return str_contains($payload, 'Johnny') && str_contains($payload, 'johnny@example.com');
        });
    }

    public function test_parses_valid_json_health(): void
    {
        $this->fake(json_encode(['health' => 'hot', 'summary' => 'Ready to convert.', 'score' => 90]));
        $lead = Lead::create(['first_name' => 'Ready', 'last_name' => 'Go']);

        $analysis = app(LeadAnalysisService::class)->analyze($lead);

        $this->assertSame('hot', $analysis->health);
        $this->assertSame(90, $analysis->score);
        $this->assertSame('Ready to convert.', $analysis->summary);
    }

    public function test_handles_malformed_json_as_unknown(): void
    {
        $this->fake('Sorry, I cannot produce JSON right now.');
        $lead = Lead::create(['first_name' => 'Bad', 'last_name' => 'Json']);

        $analysis = app(LeadAnalysisService::class)->analyze($lead);

        $this->assertSame('unknown', $analysis->health);
    }

    public function test_uses_cache_when_fresh(): void
    {
        $this->fake(json_encode(['health' => 'warm', 'summary' => 'Interested.']));
        $lead = Lead::create(['first_name' => 'Cache', 'last_name' => 'Hit']);

        $svc = app(LeadAnalysisService::class);
        $a = $svc->analyze($lead);
        $b = $svc->analyze($lead);

        $this->assertSame($a->id, $b->id);
        $this->assertSame(1, AiRecordAnalysis::count());
        Http::assertSentCount(1);
    }

    public function test_force_refresh_bypasses_cache(): void
    {
        $this->fake(json_encode(['health' => 'warm', 'summary' => 'Interested.']));
        $lead = Lead::create(['first_name' => 'Force', 'last_name' => 'Refresh']);

        $svc = app(LeadAnalysisService::class);
        $svc->analyze($lead);
        $svc->analyze($lead, forceRefresh: true);

        $this->assertSame(2, AiRecordAnalysis::count());
        Http::assertSentCount(2);
    }
}
