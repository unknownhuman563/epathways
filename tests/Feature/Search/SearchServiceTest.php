<?php

namespace Tests\Feature\Search;

use App\Models\Lead;
use App\Models\Property;
use App\Models\User;
use App\Services\SearchService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SearchServiceTest extends TestCase
{
    use RefreshDatabase;

    private SearchService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new SearchService();
    }

    private function user(string $role): User
    {
        return User::factory()->create(['role' => $role]);
    }

    private function lead(array $attrs = []): Lead
    {
        return Lead::create(array_merge(['first_name' => 'Test', 'last_name' => 'Lead'], $attrs));
    }

    private function property(array $attrs = []): Property
    {
        return Property::create(array_merge([
            'name' => 'Sample House', 'location' => 'Auckland', 'room_type' => 'single',
            'rent_single' => 250, 'status' => 'available',
        ], $attrs));
    }

    /** Flatten group items for convenience. */
    private function flatten(array $groups): array
    {
        return collect($groups)->flatMap(fn ($g) => $g['items'])->all();
    }

    private function group(array $groups, string $type): ?array
    {
        return collect($groups)->firstWhere('type', $type);
    }

    public function test_returns_empty_for_query_under_two_chars(): void
    {
        $this->lead(['first_name' => 'Maria']);
        $this->assertSame([], $this->service->search('M', $this->user('admin')));
    }

    public function test_finds_lead_by_name_exact_match_scores_100(): void
    {
        $this->lead(['first_name' => 'Mariana', 'last_name' => 'Cruz', 'email' => 'mariana@example.com']);

        $groups = $this->service->search('Mariana Cruz', $this->user('admin'));
        $leads = $this->group($groups, 'Lead');

        $this->assertNotNull($leads);
        $this->assertSame(100, $leads['items'][0]['score']); // full name equals query
    }

    public function test_finds_lead_by_email_partial_scores_10(): void
    {
        $this->lead(['first_name' => 'Bob', 'last_name' => 'Jones', 'email' => 'bob.jones@example.com']);

        $groups = $this->service->search('jones@example', $this->user('admin'));
        $leads = $this->group($groups, 'Lead');

        $this->assertNotNull($leads);
        $this->assertSame(10, $leads['items'][0]['score']); // contained in the email
    }

    public function test_finds_property_by_code_case_insensitive(): void
    {
        $this->property(['code' => 'EXALT-03', 'name' => 'Lockheed St']);

        $groups = $this->service->search('exalt-03', $this->user('accommodation'));
        $props = $this->group($groups, 'Property');

        $this->assertNotNull($props);
        $this->assertStringContainsString('EXALT-03', $props['items'][0]['label']);
        $this->assertSame(100, $props['items'][0]['score']);
    }

    public function test_role_gated_sales_sees_leads_not_properties(): void
    {
        $this->lead(['first_name' => 'Zephyr']);
        $this->property(['name' => 'Zephyr House']);

        $groups = $this->service->search('Zephyr', $this->user('sales'));

        $this->assertNotNull($this->group($groups, 'Lead'));
        $this->assertNull($this->group($groups, 'Property')); // sales can't see properties
    }

    public function test_role_gated_super_admin_sees_everything(): void
    {
        $this->lead(['first_name' => 'Zephyr']);
        $this->property(['name' => 'Zephyr House']);

        $groups = $this->service->search('Zephyr', $this->user('super_admin'));

        $this->assertNotNull($this->group($groups, 'Lead'));
        $this->assertNotNull($this->group($groups, 'Property'));
    }

    public function test_results_grouped_by_entity_type(): void
    {
        $this->lead(['first_name' => 'Grouptest']);
        $this->property(['name' => 'Grouptest Villa']);

        $groups = $this->service->search('Grouptest', $this->user('admin'));

        foreach ($groups as $g) {
            $this->assertArrayHasKey('type', $g);
            $this->assertArrayHasKey('label', $g);
            $this->assertArrayHasKey('items', $g);
            $this->assertArrayHasKey('total', $g);
        }
    }

    public function test_max_five_results_per_group(): void
    {
        for ($i = 0; $i < 7; $i++) {
            $this->lead(['first_name' => 'Crowd', 'last_name' => "Member{$i}"]);
        }

        $groups = $this->service->search('Crowd', $this->user('admin'));
        $leads = $this->group($groups, 'Lead');

        $this->assertCount(5, $leads['items']);
        $this->assertSame(7, $leads['total']); // total reflects the real count
    }

    public function test_within_group_higher_score_first(): void
    {
        $this->lead(['first_name' => 'Solo', 'last_name' => 'Person']);                 // "Solo" prefix → 50
        $this->lead(['first_name' => 'Mr', 'last_name' => 'Solo', 'email' => 'a@b.co']); // contains in last name → lower

        $groups = $this->service->search('Solo', $this->user('admin'));
        $items = $this->group($groups, 'Lead')['items'];

        $this->assertGreaterThanOrEqual($items[1]['score'], $items[0]['score']);
    }

    public function test_query_with_no_matches_returns_empty(): void
    {
        $this->lead(['first_name' => 'Alice']);
        $this->assertSame([], $this->service->search('zzzznomatch', $this->user('admin')));
    }
}
