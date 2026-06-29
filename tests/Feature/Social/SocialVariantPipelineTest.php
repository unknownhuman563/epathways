<?php

namespace Tests\Feature\Social;

use App\Models\SocialPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SocialVariantPipelineTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Empty Cerebras key → generation uses fixture copies (deterministic).
        // '' (not null) because CerebrasService types $apiKey as string.
        config(['services.cerebras.api_key' => '', 'services.zernio.api_key' => null]);
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function generate(): array
    {
        return $this->actingAs($this->admin())
            ->postJson('/webhook/social/generate-variants', [
                'campaign_name' => 'June Push', 'service' => 'education',
                'platforms' => ['facebook'], 'variant_count' => 3, 'tone' => 'friendly',
            ])->json();
    }

    public function test_generate_persists_variants_for_review(): void
    {
        $res = $this->generate();

        $this->assertTrue($res['ok']);
        $this->assertSame(3, $res['generated']);
        $this->assertCount(3, SocialPost::where('status', 'awaiting_review')->get());
        $this->assertSame('education', SocialPost::first()->service);
    }

    public function test_list_variants_returns_only_awaiting(): void
    {
        $this->generate();
        SocialPost::first()->update(['status' => 'rejected']);

        $this->actingAs($this->admin())
            ->getJson('/webhook/social/list-variants')
            ->assertOk()
            ->assertJsonCount(2, 'variants');
    }

    public function test_update_variant_edits_copy(): void
    {
        $this->generate();
        $id = SocialPost::first()->id;

        $this->actingAs($this->admin())
            ->postJson('/webhook/social/update-variant', [
                'variantId' => (string) $id, 'headline' => 'New head', 'body' => 'New body', 'cta' => 'Go',
            ])->assertOk();

        $this->assertSame('New head', SocialPost::find($id)->headline);
    }

    public function test_reject_variant(): void
    {
        $this->generate();
        $id = SocialPost::first()->id;

        $this->actingAs($this->admin())
            ->postJson('/webhook/social/reject-variant', ['variantId' => (string) $id])
            ->assertOk();

        $this->assertSame('rejected', SocialPost::find($id)->status);
    }

    public function test_approve_without_zernio_marks_scheduled(): void
    {
        $this->generate();
        $id = SocialPost::first()->id;

        $this->actingAs($this->admin())
            ->postJson('/webhook/social/approve-variant', [
                'variantId' => (string) $id, 'scheduleAt' => now()->addDay()->toIso8601String(),
            ])->assertOk();

        $post = SocialPost::find($id);
        $this->assertSame('scheduled', $post->status);
        $this->assertNotNull($post->scheduled_at);
    }

    public function test_approve_with_zernio_publishes_and_links_post(): void
    {
        config(['services.zernio.api_key' => 'sk_test', 'services.zernio.base_url' => 'https://zernio.com/api/v1']);
        Http::fake(function ($request) {
            if (str_contains($request->url(), '/accounts')) {
                return Http::response(['data' => [['_id' => 'acc_fb', 'platform' => 'facebook', 'status' => 'active']]]);
            }
            if (str_contains($request->url(), '/posts')) {
                return Http::response(['post' => ['_id' => 'zpost_9']]);
            }

            return Http::response([]);
        });

        $this->generate();
        $id = SocialPost::first()->id;

        $this->actingAs($this->admin())
            ->postJson('/webhook/social/approve-variant', [
                'variantId' => (string) $id, 'scheduleAt' => now()->subMinute()->toIso8601String(),
            ])->assertOk();

        $post = SocialPost::find($id);
        $this->assertSame('published', $post->status);    // past time → publish now
        $this->assertSame('zpost_9', $post->zernio_post_id);

        Http::assertSent(fn ($r) => str_contains($r->url(), '/posts') && $r->method() === 'POST');
    }

    public function test_stats_reflect_real_counts(): void
    {
        $this->generate(); // 3 awaiting

        $this->actingAs($this->admin())
            ->getJson('/webhook/social/stats')
            ->assertOk()
            ->assertJsonPath('pendingVariants', 3)
            ->assertJsonPath('activeCampaigns', 1);
    }
}
