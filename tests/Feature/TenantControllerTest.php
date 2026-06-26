<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as AssertInertia;
use Tests\TestCase;

class TenantControllerTest extends TestCase
{
    use RefreshDatabase;

    private function user(): User
    {
        return User::factory()->create(['role' => 'accommodation']);
    }

    private function property(array $overrides = []): Property
    {
        return Property::create(array_merge([
            'name' => 'Test House',
            'rent_single' => 200,
            'status' => 'available',
            'is_active' => true,
            'total_rooms' => 3,
        ], $overrides));
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'property_id' => $this->property()->id,
            'first_name' => 'Ann',
            'family_name' => 'Lee',
            'contract_type' => 'fixed_term',
        ], $overrides);
    }

    private function tenant(array $overrides = []): Tenant
    {
        return Tenant::create(array_merge([
            'property_id' => $this->property()->id,
            'first_name' => 'Sam',
            'family_name' => 'Park',
            'contract_type' => 'fixed_term',
            'current_status' => 'active',
        ], $overrides));
    }

    // 1
    public function test_can_create_tenant_assigned_to_property(): void
    {
        $property = $this->property();

        $this->actingAs($this->user())
            ->post('/portal/accommodation/tenants', $this->payload(['property_id' => $property->id]))
            ->assertRedirect();

        $this->assertDatabaseHas('accommodation_tenants', [
            'property_id' => $property->id, 'first_name' => 'Ann', 'current_status' => 'active',
        ]);
    }

    // 2
    public function test_cannot_create_tenant_with_missing_property(): void
    {
        $this->actingAs($this->user())
            ->post('/portal/accommodation/tenants', $this->payload(['property_id' => 99999]))
            ->assertInvalid(['property_id']);
    }

    // 3
    public function test_contract_end_before_start_is_rejected(): void
    {
        $this->actingAs($this->user())
            ->post('/portal/accommodation/tenants', $this->payload([
                'contract_start' => '2026-06-10', 'contract_end' => '2026-06-01',
            ]))
            ->assertInvalid(['contract_end']);
    }

    // 4
    public function test_negative_weekly_rent_is_rejected(): void
    {
        $this->actingAs($this->user())
            ->post('/portal/accommodation/tenants', $this->payload(['weekly_rent_nzd' => -5]))
            ->assertInvalid(['weekly_rent_nzd']);
    }

    // 5
    public function test_email_must_be_valid(): void
    {
        $this->actingAs($this->user())
            ->post('/portal/accommodation/tenants', $this->payload(['email' => 'not-an-email']))
            ->assertInvalid(['email']);
    }

    // 6
    public function test_index_sorts_by_days_to_end_ascending(): void
    {
        $p = $this->property();
        $this->tenant(['property_id' => $p->id, 'contract_end' => now()->addDays(30)->toDateString()]);
        $soonest = $this->tenant(['property_id' => $p->id, 'contract_end' => now()->addDays(5)->toDateString()]);
        $this->tenant(['property_id' => $p->id, 'contract_end' => null]); // no date — sorts last

        $this->actingAs($this->user())
            ->get('/portal/accommodation/tenants')
            ->assertInertia(fn (AssertInertia $page) => $page
                ->component('portal/accommodation/Tenants')
                ->where('tenants.data.0.id', $soonest->id));
    }

    // 7
    public function test_filter_by_property(): void
    {
        $a = $this->property();
        $b = $this->property();
        $this->tenant(['property_id' => $a->id]);
        $this->tenant(['property_id' => $b->id]);

        $this->actingAs($this->user())
            ->get('/portal/accommodation/tenants?property_id='.$a->id)
            ->assertInertia(fn (AssertInertia $page) => $page->has('tenants.data', 1));
    }

    // 8
    public function test_filter_by_status(): void
    {
        $p = $this->property();
        $this->tenant(['property_id' => $p->id, 'current_status' => 'active']);
        $this->tenant(['property_id' => $p->id, 'current_status' => 'vacated']);

        $this->actingAs($this->user())
            ->get('/portal/accommodation/tenants?status=vacated')
            ->assertInertia(fn (AssertInertia $page) => $page->has('tenants.data', 1));
    }

    // 9
    public function test_missing_docs_filter(): void
    {
        $p = $this->property();
        $this->tenant(['property_id' => $p->id, 'has_passport_in_drive' => true, 'has_tenancy_agreement_in_drive' => true, 'has_inspection_report_in_drive' => true]);
        $this->tenant(['property_id' => $p->id, 'has_passport_in_drive' => false]);

        $this->actingAs($this->user())
            ->get('/portal/accommodation/tenants?missing_docs=1')
            ->assertInertia(fn (AssertInertia $page) => $page->has('tenants.data', 1));
    }

    // 10
    public function test_search_by_name_email_phone(): void
    {
        $p = $this->property();
        $this->tenant(['property_id' => $p->id, 'first_name' => 'Zoltan', 'email' => 'zol@example.com', 'phone' => '0211234567']);
        $this->tenant(['property_id' => $p->id, 'first_name' => 'Other']);

        $user = $this->user();
        foreach (['Zoltan', 'zol@example.com', '0211234567'] as $term) {
            $this->actingAs($user)
                ->get('/portal/accommodation/tenants?search='.urlencode($term))
                ->assertInertia(fn (AssertInertia $page) => $page->has('tenants.data', 1));
        }
    }

    // 11
    public function test_update_persists_changes(): void
    {
        $tenant = $this->tenant();

        $this->actingAs($this->user())
            ->put("/portal/accommodation/tenants/{$tenant->id}", $this->payload([
                'property_id' => $tenant->property_id, 'first_name' => 'Renamed',
            ]))
            ->assertRedirect();

        $this->assertEquals('Renamed', $tenant->fresh()->first_name);
    }

    // 12
    public function test_soft_delete_only_when_vacated(): void
    {
        $active = $this->tenant(['current_status' => 'active']);
        $this->actingAs($this->user())->delete("/portal/accommodation/tenants/{$active->id}");
        $this->assertNull($active->fresh()->deleted_at);

        $vacated = $this->tenant(['current_status' => 'vacated']);
        $this->actingAs($this->user())->delete("/portal/accommodation/tenants/{$vacated->id}");
        $this->assertSoftDeleted($vacated);
    }

    // 13
    public function test_mark_notice_given(): void
    {
        $tenant = $this->tenant();

        $this->actingAs($this->user())
            ->post("/portal/accommodation/tenants/{$tenant->id}/notice", ['reason' => 'Moving overseas']);

        $this->assertEquals('notice_given', $tenant->fresh()->current_status);
        $this->assertStringContainsString('Moving overseas', $tenant->fresh()->notes);
    }

    // 14
    public function test_mark_vacated_sets_status_and_ended_at(): void
    {
        $tenant = $this->tenant();

        $this->actingAs($this->user())
            ->post("/portal/accommodation/tenants/{$tenant->id}/vacate", ['vacate_date' => now()->toDateString()]);

        $fresh = $tenant->fresh();
        $this->assertEquals('vacated', $fresh->current_status);
        $this->assertNotNull($fresh->ended_at);
    }

    // 15
    public function test_renew_updates_dates_and_resets_status(): void
    {
        $tenant = $this->tenant(['current_status' => 'notice_given']);

        $this->actingAs($this->user())
            ->post("/portal/accommodation/tenants/{$tenant->id}/renew", [
                'new_contract_start' => '2026-07-01', 'new_contract_end' => '2027-07-01',
            ]);

        $fresh = $tenant->fresh();
        $this->assertEquals('active', $fresh->current_status);
        $this->assertEquals('2026-07-01', $fresh->contract_start->toDateString());
        $this->assertEquals('2027-07-01', $fresh->contract_end->toDateString());
    }

    // 16
    public function test_move_creates_new_tenant_and_vacates_old(): void
    {
        $from = $this->property();
        $to = $this->property();
        $tenant = $this->tenant(['property_id' => $from->id, 'first_name' => 'Mover']);

        $this->actingAs($this->user())
            ->post("/portal/accommodation/tenants/{$tenant->id}/move", [
                'new_property_id' => $to->id, 'move_date' => now()->toDateString(),
            ])->assertRedirect();

        $old = $tenant->fresh();
        $this->assertEquals('vacated', $old->current_status);
        $this->assertEquals($to->id, $old->moved_to_property_id);

        $this->assertDatabaseHas('accommodation_tenants', [
            'property_id' => $to->id, 'first_name' => 'Mover', 'current_status' => 'active',
        ]);
        $this->assertEquals(2, Tenant::where('first_name', 'Mover')->count());
    }

    // 17
    public function test_property_rooms_occupied_counts_active_tenants(): void
    {
        $p = $this->property(['total_rooms' => 3]);
        $this->tenant(['property_id' => $p->id, 'current_status' => 'active']);
        $this->tenant(['property_id' => $p->id, 'current_status' => 'notice_given']); // still counts
        $this->tenant(['property_id' => $p->id, 'current_status' => 'vacated']);       // does not

        $this->assertEquals(2, Property::find($p->id)->rooms_occupied);
    }

    // 18
    public function test_property_occupancy_status(): void
    {
        $p = $this->property(['total_rooms' => 2]);
        $this->assertEquals('vacant', Property::find($p->id)->occupancy_status);

        $this->tenant(['property_id' => $p->id, 'current_status' => 'active']);
        $this->assertEquals('partial', Property::find($p->id)->occupancy_status);

        $this->tenant(['property_id' => $p->id, 'current_status' => 'active']);
        $this->assertEquals('full', Property::find($p->id)->occupancy_status);
    }

    // 19
    public function test_cannot_delete_property_with_active_tenants(): void
    {
        $p = $this->property();
        $this->tenant(['property_id' => $p->id, 'current_status' => 'active']);

        $this->actingAs($this->user())->delete("/portal/accommodation/properties/{$p->id}");

        $this->assertDatabaseHas('accommodation_properties', ['id' => $p->id]);
    }

    // 20
    public function test_can_delete_property_after_tenants_vacated(): void
    {
        $p = $this->property();
        $this->tenant(['property_id' => $p->id, 'current_status' => 'vacated']);

        $this->actingAs($this->user())
            ->delete("/portal/accommodation/properties/{$p->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('accommodation_properties', ['id' => $p->id]);
    }

    // 21
    public function test_csv_export_returns_expected_columns(): void
    {
        $p = $this->property(['address' => '21 Vazey Way']);
        $this->tenant(['property_id' => $p->id, 'first_name' => 'Export', 'family_name' => 'Me']);

        $response = $this->actingAs($this->user())->get('/portal/accommodation/tenants/export');
        $response->assertOk();

        $body = $response->streamedContent();
        $this->assertStringContainsString('display_name', $body);
        $this->assertStringContainsString('property_address', $body);
        $this->assertStringContainsString('Export Me', $body);
        $this->assertStringContainsString('21 Vazey Way', $body);
    }

    // 22
    public function test_detail_shows_historical_tenants(): void
    {
        $p = $this->property();
        $current = $this->tenant(['property_id' => $p->id, 'current_status' => 'active']);
        $this->tenant(['property_id' => $p->id, 'current_status' => 'vacated', 'ended_at' => now()]);

        $this->actingAs($this->user())
            ->get("/portal/accommodation/tenants/{$current->id}")
            ->assertInertia(fn (AssertInertia $page) => $page
                ->component('portal/accommodation/TenantDetail')
                ->has('historical', 1));
    }

    public function test_archive_soft_deletes_and_hides_from_default_list(): void
    {
        $t = $this->tenant();

        $this->actingAs($this->user())
            ->from('/portal/accommodation/tenants')
            ->patch("/portal/accommodation/tenants/{$t->id}/archive")
            ->assertRedirect();

        $this->assertSoftDeleted('accommodation_tenants', ['id' => $t->id]);

        // Default list excludes archived tenants.
        $this->actingAs($this->user())->get('/portal/accommodation/tenants')
            ->assertInertia(fn (AssertInertia $page) => $page->has('tenants.data', 0));
    }

    public function test_archived_filter_shows_only_archived_tenants(): void
    {
        $active = $this->tenant(['first_name' => 'Active']);
        $archived = $this->tenant(['first_name' => 'Gone']);
        $archived->delete();

        $this->actingAs($this->user())->get('/portal/accommodation/tenants?archived=1')
            ->assertInertia(fn (AssertInertia $page) => $page
                ->has('tenants.data', 1)
                ->where('tenants.data.0.id', $archived->id));
    }

    public function test_restore_brings_back_an_archived_tenant(): void
    {
        $t = $this->tenant();
        $t->delete();

        $this->actingAs($this->user())
            ->from('/portal/accommodation/tenants?archived=1')
            ->patch("/portal/accommodation/tenants/{$t->id}/restore")
            ->assertRedirect();

        $this->assertNull($t->fresh()->deleted_at);
        $this->actingAs($this->user())->get('/portal/accommodation/tenants')
            ->assertInertia(fn (AssertInertia $page) => $page->has('tenants.data', 1));
    }
}
