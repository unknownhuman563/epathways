<?php

namespace Tests\Unit\Services;

use App\Models\Setting;
use App\Services\AIService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AIServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_handles_a_successful_response(): void
    {
        Http::fake([
            'openrouter.ai/*' => Http::response([
                'choices' => [['message' => ['content' => 'Hello there.']]],
                'usage'   => ['total_tokens' => 12],
                'model'   => 'google/gemini-2.5-flash',
            ], 200),
        ]);

        $result = (new AIService())->chat([['role' => 'user', 'content' => 'hi']]);

        $this->assertSame('Hello there.', $result['content']);
        $this->assertSame(12, $result['tokens']);
        $this->assertSame('google/gemini-2.5-flash', $result['model']);
    }

    public function test_handles_5xx_gracefully(): void
    {
        Http::fake(['openrouter.ai/*' => Http::response('upstream error', 500)]);

        $result = (new AIService())->chat([['role' => 'user', 'content' => 'hi']]);

        $this->assertNull($result['content']);
    }

    public function test_handles_network_failure_gracefully(): void
    {
        Http::fake(['openrouter.ai/*' => fn () => throw new ConnectionException('timeout')]);

        $result = (new AIService())->chat([['role' => 'user', 'content' => 'hi']]);

        $this->assertNull($result['content']);
    }

    public function test_is_enabled_respects_config_and_tenant_toggle(): void
    {
        $ai = new AIService();

        // Default: config true, no DB row → tenant defaults true.
        $this->assertTrue($ai->isEnabled());

        // Config kill switch off.
        config(['ai.enabled' => false]);
        $this->assertFalse($ai->isEnabled());

        // Config back on, tenant toggle off.
        config(['ai.enabled' => true]);
        Setting::set('ai_enabled', false, 'bool');
        $this->assertFalse($ai->isEnabled());
    }
}
