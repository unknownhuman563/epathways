<?php

namespace Tests\Feature\Social;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AdTargetingTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function configureZernio(): void
    {
        config(['services.zernio.api_key' => 'sk_test', 'services.zernio.base_url' => 'https://zernio.com/api/v1']);
    }

    private function configureCerebras(): void
    {
        config([
            'services.cerebras.api_key' => 'sk_cb',
            'services.cerebras.base_url' => 'https://api.cerebras.ai/v1',
            'services.cerebras.model' => 'test-model',
        ]);
    }

    public function test_targeting_search_proxies_zernio(): void
    {
        $this->configureZernio();
        Http::fake(['*/ads/targeting/search*' => Http::response(['data' => [
            ['id' => 'i1', 'name' => 'Study abroad', 'type' => 'interest', 'path' => ['Education'], 'audienceSize' => 1000000],
        ]])]);

        $this->actingAs($this->admin())
            ->getJson('/webhook/social/ad-targeting-search?q=study&accountId=acc_meta&dimension=interest')
            ->assertOk()
            ->assertJsonPath('results.0.id', 'i1')
            ->assertJsonPath('results.0.name', 'Study abroad');
    }

    public function test_targeting_search_empty_without_zernio(): void
    {
        config(['services.zernio.api_key' => '']);

        $this->actingAs($this->admin())
            ->getJson('/webhook/social/ad-targeting-search?q=study&accountId=acc_meta')
            ->assertOk()->assertExactJson(['results' => []]);
    }

    public function test_ai_targeting_requires_cerebras(): void
    {
        $this->configureZernio();
        config(['services.cerebras.api_key' => '']);

        $this->actingAs($this->admin())
            ->postJson('/webhook/social/ai-targeting', ['content' => 'Study nursing in NZ', 'accountId' => 'acc_meta'])
            ->assertStatus(422);
    }

    public function test_ai_targeting_suggests_and_resolves_interests(): void
    {
        $this->configureZernio();
        $this->configureCerebras();

        Http::fake([
            '*/chat/completions' => Http::response(['choices' => [['message' => ['content' => json_encode([
                'age_min' => 20, 'age_max' => 35, 'countries' => ['IN', 'PH'],
                'interests' => ['Study abroad'], 'rationale' => 'Young prospective students.',
            ])]]]]),
            '*/ads/targeting/search*' => Http::response(['data' => [
                ['id' => 'i_abroad', 'name' => 'Study abroad', 'type' => 'interest'],
            ]]),
        ]);

        $this->actingAs($this->admin())
            ->postJson('/webhook/social/ai-targeting', [
                'content' => 'Study nursing in New Zealand', 'accountId' => 'acc_meta', 'goal' => 'traffic', 'platform' => 'facebook',
            ])
            ->assertOk()
            ->assertJsonPath('ageMin', 20)
            ->assertJsonPath('ageMax', 35)
            ->assertJsonPath('countries.0', 'IN')
            ->assertJsonPath('interests.0.id', 'i_abroad')
            ->assertJsonPath('interests.0.name', 'Study abroad')
            ->assertJsonPath('rationale', 'Young prospective students.');
    }

    public function test_audiences_list_and_save(): void
    {
        $this->configureZernio();
        Http::fake(['*/ads/audiences*' => Http::response(['data' => [
            ['id' => 'aud1', 'name' => 'NZ students', 'type' => 'saved_targeting', 'spec' => ['ageMin' => 18]],
        ]])]);

        $this->actingAs($this->admin())
            ->getJson('/webhook/social/ad-audiences?accountId=acc_meta&adAccountId=act_1')
            ->assertOk()->assertJsonPath('presets.0.name', 'NZ students');

        Http::fake(['*/ads/audiences*' => Http::response(['audience' => ['id' => 'aud2', 'name' => 'My preset']])]);
        $this->actingAs($this->admin())
            ->postJson('/webhook/social/ad-audience-save', [
                'accountId' => 'acc_meta', 'name' => 'My preset', 'spec' => ['ageMin' => 18, 'ageMax' => 40],
            ])
            ->assertOk()->assertJsonPath('ok', true);
    }

    public function test_boost_sends_normalized_targeting(): void
    {
        $this->configureZernio();
        Http::fake(['*/ads/boost' => Http::response(['ad' => ['id' => 'ad_123']])]);

        $this->actingAs($this->admin())
            ->postJson('/webhook/social/ads-boost', [
                'postId' => 'p1', 'accountId' => 'acc_meta', 'adAccountId' => 'act_1',
                'platform' => 'facebook', 'name' => 'Boost', 'goal' => 'traffic',
                'budgetAmount' => 20, 'budgetType' => 'daily',
                'targeting' => [
                    'ageMin' => 22, 'ageMax' => 40, 'countries' => ['nz', 'in'],
                    'interests' => [['id' => 'i1', 'name' => 'Study abroad']], 'advantageAudience' => true,
                ],
            ])
            ->assertOk()->assertJsonPath('ad_id', 'ad_123');

        Http::assertSent(function ($request) {
            $t = $request->data()['targeting'] ?? [];

            return str_contains($request->url(), '/ads/boost')
                && ($t['ageMin'] ?? null) === 22
                && ($t['countries'] ?? []) === ['NZ', 'IN']           // uppercased
                && ($t['advantage_audience'] ?? null) === 1            // boolean → Meta's 0/1
                && ($t['interests'][0]['id'] ?? null) === 'i1';
        });
    }

    public function test_boost_rejects_invalid_age(): void
    {
        $this->configureZernio();

        $this->actingAs($this->admin())
            ->postJson('/webhook/social/ads-boost', [
                'postId' => 'p1', 'accountId' => 'acc_meta', 'adAccountId' => 'act_1',
                'platform' => 'facebook', 'name' => 'Boost', 'goal' => 'traffic',
                'budgetAmount' => 20, 'budgetType' => 'daily',
                'targeting' => ['ageMin' => 5], // below the 13 floor
            ])
            ->assertStatus(422);
    }

    public function test_published_posts_listed_for_picker(): void
    {
        $this->configureZernio();
        Http::fake(['*/posts*' => Http::response(['data' => [
            ['id' => 'post1', 'content' => 'Study in NZ — free assessment!', 'platforms' => [['platform' => 'facebook']], 'publishedAt' => '2026-06-20T00:00:00Z'],
        ]])]);

        $this->actingAs($this->admin())
            ->getJson('/webhook/social/published-posts')
            ->assertOk()
            ->assertJsonPath('posts.0.id', 'post1')
            ->assertJsonPath('posts.0.platform', 'facebook')
            ->assertJsonPath('posts.0.content', 'Study in NZ — free assessment!');
    }
}
