<?php

namespace Tests\Feature\Social;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SocialInboxAdsTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function fakeZernio(): void
    {
        config(['services.zernio.api_key' => 'sk_test', 'services.zernio.base_url' => 'https://zernio.com/api/v1']);

        Http::fake(function ($request) {
            $url = $request->url();
            if (str_contains($url, '/inbox/conversations') && str_contains($url, '/messages')) {
                return Http::response(['data' => [['id' => 'm1', 'direction' => 'incoming', 'message' => 'Hi there', 'createdAt' => '2026-06-28T01:00:00Z']]]);
            }
            if (str_contains($url, '/inbox/conversations')) {
                return Http::response(['data' => [['id' => 'c1', 'accountId' => 'acc_fb', 'platform' => 'facebook', 'participantName' => 'Jane', 'lastMessage' => 'Hello', 'unreadCount' => 2, 'updatedTime' => '2026-06-28T00:00:00Z']]]);
            }
            if (str_contains($url, '/inbox/comments')) {
                return Http::response(['data' => [['id' => 'post1', 'accountId' => 'acc_fb', 'platform' => 'facebook', 'content' => 'Our event!', 'commentCount' => 3, 'permalink' => 'https://fb.com/x', 'createdTime' => '2026-06-25T00:00:00Z']]]);
            }
            if (str_contains($url, '/analytics') && ! str_contains($url, '/ads')) {
                return Http::response(['data' => [[
                    'postId' => 'p1', 'content' => 'Great post', 'platform' => 'facebook', 'publishedAt' => '2026-06-20T00:00:00Z',
                    'analytics' => ['impressions' => 500, 'reach' => 400, 'likes' => 30, 'comments' => 5, 'shares' => 2, 'clicks' => 10, 'engagementRate' => 3.5],
                ]]]);
            }
            if (str_contains($url, '/ads/accounts')) {
                return Http::response(['data' => [['_id' => 'adacc1', 'platform' => 'facebook', 'name' => 'Main Ad Acct']]]);
            }
            if (preg_match('#/ads/[^/]+/analytics#', $url)) {
                return Http::response(['spend' => 12.5, 'impressions' => 1000, 'clicks' => 40, 'ctr' => 4, 'cpc' => 0.31, 'cpm' => 12.5]);
            }
            if (str_contains($url, '/ads')) {
                return Http::response(['data' => [['_id' => 'ad1', 'name' => 'Promo', 'platform' => 'facebook', 'status' => 'active', 'goal' => 'traffic']]]);
            }

            return Http::response(['ok' => true]);
        });
    }

    public function test_inbox_conversations_mapped(): void
    {
        $this->fakeZernio();
        $this->actingAs($this->admin())->getJson('/webhook/social/inbox-conversations')
            ->assertOk()
            ->assertJsonPath('conversations.0.name', 'Jane')
            ->assertJsonPath('conversations.0.account_id', 'acc_fb')
            ->assertJsonPath('conversations.0.snippet', 'Hello')
            ->assertJsonPath('conversations.0.unread', 2);
    }

    public function test_inbox_messages_mapped(): void
    {
        $this->fakeZernio();
        $this->actingAs($this->admin())->getJson('/webhook/social/inbox-messages?conversationId=c1&accountId=acc_fb')
            ->assertOk()
            ->assertJsonPath('messages.0.text', 'Hi there')
            ->assertJsonPath('messages.0.direction', 'in');

        Http::assertSent(fn ($r) => str_contains($r->url(), 'accountId=acc_fb'));
    }

    public function test_inbox_send(): void
    {
        $this->fakeZernio();
        $this->actingAs($this->admin())->postJson('/webhook/social/inbox-send', ['conversationId' => 'c1', 'accountId' => 'acc_fb', 'text' => 'Reply'])
            ->assertOk()->assertJsonPath('ok', true);

        Http::assertSent(fn ($r) => str_contains($r->url(), '/inbox/conversations/c1/messages') && $r->method() === 'POST');
    }

    public function test_zernio_webhook_verifies_hmac_and_bumps_signal(): void
    {
        config(['services.zernio.webhook_secret' => 'sek']);
        $raw = json_encode(['event' => 'message.received']);
        $good = hash_hmac('sha256', $raw, 'sek');

        // Bad signature is rejected.
        $this->call('POST', '/webhook/zernio', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_X_ZERNIO_SIGNATURE' => 'bad'], $raw)
            ->assertStatus(401);

        // Valid HMAC signature is accepted and bumps the inbox signal.
        $this->call('POST', '/webhook/zernio', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_X_ZERNIO_SIGNATURE' => $good], $raw)
            ->assertOk();

        $resp = $this->actingAs($this->admin())->getJson('/webhook/social/inbox-signal')->assertOk();
        $this->assertGreaterThan(0, $resp->json('at'));
    }

    public function test_inbox_mark_read(): void
    {
        $this->fakeZernio();
        $this->actingAs($this->admin())->postJson('/webhook/social/inbox-read', ['conversationId' => 'c1', 'accountId' => 'acc_fb'])
            ->assertOk()->assertJsonPath('ok', true);

        Http::assertSent(fn ($r) => str_contains($r->url(), '/inbox/conversations/c1/read') && $r->method() === 'POST');
    }

    public function test_inbox_comments_mapped(): void
    {
        $this->fakeZernio();
        $this->actingAs($this->admin())->getJson('/webhook/social/inbox-comments')
            ->assertOk()
            ->assertJsonPath('comments.0.content', 'Our event!')
            ->assertJsonPath('comments.0.post_id', 'post1')
            ->assertJsonPath('comments.0.comment_count', 3);
    }

    public function test_ads_list_and_analytics(): void
    {
        $this->fakeZernio();
        $this->actingAs($this->admin())->getJson('/webhook/social/ads-list')
            ->assertOk()->assertJsonPath('ads.0.name', 'Promo');

        $this->actingAs($this->admin())->getJson('/webhook/social/ad-analytics?adId=ad1')
            ->assertOk()->assertJsonPath('impressions', 1000)->assertJsonPath('ctr', 4);
    }

    public function test_performance_aggregates_and_joins_leads(): void
    {
        $this->fakeZernio();
        \App\Models\Lead::create(['first_name' => 'A', 'last_name' => 'B', 'email' => 'a@example.com']);

        $this->actingAs($this->admin())->getJson('/webhook/social/analytics')
            ->assertOk()
            ->assertJsonPath('totals.impressions', 500)
            ->assertJsonPath('totals.engagement', 37) // 30 + 5 + 2
            ->assertJsonPath('leads', 1)
            ->assertJsonPath('posts.0.platform', 'facebook');
    }

    public function test_endpoints_return_empty_without_key(): void
    {
        config(['services.zernio.api_key' => null]);
        $this->actingAs($this->admin())->getJson('/webhook/social/inbox-conversations')
            ->assertOk()->assertJsonCount(0, 'conversations');
        $this->actingAs($this->admin())->getJson('/webhook/social/ads-list')
            ->assertOk()->assertJsonCount(0, 'ads');
    }
}
