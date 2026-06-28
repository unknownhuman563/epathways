<?php

namespace Tests\Feature\Social;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ZernioSocialTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    /** Configure a Zernio key and fake its API. */
    private function fakeZernio(): void
    {
        config([
            'services.zernio.api_key' => 'sk_test_key',
            'services.zernio.base_url' => 'https://zernio.com/api/v1',
        ]);

        Http::fake(function ($request) {
            $url = $request->url();
            if (str_contains($url, '/accounts')) {
                return Http::response(['data' => [
                    ['_id' => 'acc_fb', 'platform' => 'facebook', 'username' => 'epathwaysnz', 'status' => 'active'],
                ]]);
            }
            if (str_contains($url, '/connect/')) {
                return Http::response(['url' => 'https://zernio.com/oauth/facebook']);
            }
            if (str_contains($url, '/posts')) {
                if ($request->method() === 'POST') {
                    return Http::response(['post' => ['_id' => 'post_123']]);
                }

                return Http::response(['data' => [
                    ['_id' => 'post_1', 'content' => 'Hello world scheduled', 'platforms' => [['platform' => 'facebook']], 'scheduledFor' => '2026-07-01T10:00:00Z', 'status' => 'scheduled'],
                ]]);
            }

            return Http::response([], 200);
        });
    }

    public function test_list_accounts_maps_zernio_response(): void
    {
        $this->fakeZernio();

        $this->actingAs($this->admin())
            ->getJson('/webhook/social/list-accounts')
            ->assertOk()
            ->assertJsonPath('accounts.0.platform', 'facebook')
            ->assertJsonPath('accounts.0.handle', 'epathwaysnz')
            ->assertJsonPath('accounts.0.id', 'acc_fb');
    }

    public function test_quick_post_publishes_now_via_zernio(): void
    {
        $this->fakeZernio();

        $this->actingAs($this->admin())
            ->postJson('/webhook/social/quick-post', ['text' => 'Hi NZ', 'platforms' => ['facebook']])
            ->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('post_id', 'post_123');

        Http::assertSent(fn ($r) => str_contains($r->url(), '/posts')
            && $r->method() === 'POST'
            && ($r['publishNow'] ?? null) === true
            && $r['platforms'][0]['accountId'] === 'acc_fb');
    }

    public function test_quick_post_schedules_when_given_a_time(): void
    {
        $this->fakeZernio();

        $this->actingAs($this->admin())
            ->postJson('/webhook/social/quick-post', [
                'text' => 'Later', 'platforms' => ['facebook'], 'schedule_at' => '2026-07-01T10:00:00Z',
            ])
            ->assertOk();

        Http::assertSent(fn ($r) => str_contains($r->url(), '/posts')
            && $r->method() === 'POST'
            && ! empty($r['scheduledFor']));
    }

    public function test_quick_post_errors_when_platform_not_connected(): void
    {
        $this->fakeZernio();

        $this->actingAs($this->admin())
            ->postJson('/webhook/social/quick-post', ['text' => 'Hi', 'platforms' => ['tiktok']])
            ->assertStatus(502); // wrapped abort(422) → Zernio call helper returns 502
    }

    public function test_list_scheduled_returns_zernio_posts(): void
    {
        $this->fakeZernio();

        $this->actingAs($this->admin())
            ->getJson('/webhook/social/list-scheduled')
            ->assertOk()
            ->assertJsonPath('posts.0.id', 'post_1')
            ->assertJsonPath('posts.0.platform', 'facebook')
            ->assertJsonPath('posts.0.status', 'scheduled');
    }

    public function test_falls_back_to_stub_without_key(): void
    {
        config(['services.zernio.api_key' => null, 'services.social.webhook_base' => null]);

        $this->actingAs($this->admin())
            ->getJson('/webhook/social/list-accounts')
            ->assertOk()
            ->assertJsonCount(3, 'accounts'); // the stub's three fixture accounts
    }
}
