<?php

namespace Tests\Feature;

use App\Models\Concern;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as AssertInertia;
use Tests\TestCase;

class ConcernTest extends TestCase
{
    use RefreshDatabase;

    private function staff(): User
    {
        return User::factory()->create(['role' => 'accommodation']);
    }

    private function property(array $o = []): Property
    {
        return Property::create(array_merge([
            'name' => 'Test House', 'rent_single' => 200, 'status' => 'available',
            'is_active' => true, 'total_rooms' => 4, 'code' => '1', 'address' => '1 Test St',
        ], $o));
    }

    private function tenant(Property $p, array $o = []): Tenant
    {
        return Tenant::create(array_merge([
            'property_id' => $p->id, 'first_name' => 'Jane', 'family_name' => 'Doe',
            'contract_type' => 'fixed_term', 'current_status' => 'active', 'email' => 'jane@example.com',
        ], $o));
    }

    private function concern(Property $p, array $o = []): Concern
    {
        return Concern::create(array_merge([
            'name' => 'Kay', 'email' => 'k@example.com', 'message' => 'No hot water', 'property_id' => $p->id,
        ], $o));
    }

    public function test_public_form_provides_active_property_options(): void
    {
        $p = $this->property(['address' => '5 King St', 'code' => '5']);

        $this->get('/accommodation/concern')
            ->assertInertia(fn (AssertInertia $page) => $page
                ->component('accommodation/Concern')
                ->has('properties', 1)
                ->where('properties.0.id', $p->id)
                ->where('properties.0.label', '#5 · 5 King St'));
    }

    public function test_store_uses_dropdown_property_links_tenant_and_defaults_to_new(): void
    {
        $prop = $this->property(['address' => '21 Vazey Way']);
        $tenant = $this->tenant($prop, ['email' => 'tenant@example.com']);

        $this->post('/accommodation/concern', [
            'name' => 'Tenant Person', 'email' => 'TENANT@example.com',
            'property_id' => $prop->id, 'message' => 'Leaky tap',
        ])->assertRedirect('/accommodation/concern');

        $this->assertDatabaseHas('accommodation_concerns', [
            'email' => 'TENANT@example.com', 'property_id' => $prop->id,
            'tenant_id' => $tenant->id, 'status' => 'new', 'assigned_to_user_id' => null,
        ]);
    }

    public function test_store_keeps_dropdown_property_even_when_email_has_a_typo(): void
    {
        $prop = $this->property(['address' => '9 King St']);

        $this->post('/accommodation/concern', [
            'name' => 'Typo Person', 'email' => 'typo@nope.com',
            'property_id' => $prop->id, 'message' => 'Broken lock',
        ])->assertRedirect();

        $this->assertDatabaseHas('accommodation_concerns', [
            'email' => 'typo@nope.com', 'property_id' => $prop->id, 'tenant_id' => null,
        ]);
    }

    public function test_store_requires_all_fields(): void
    {
        $this->from('/accommodation/concern')
            ->post('/accommodation/concern', ['email' => 'not-an-email'])
            ->assertSessionHasErrors(['name', 'email', 'property_id', 'message']);
    }

    public function test_store_rejects_unknown_or_inactive_property(): void
    {
        $inactive = $this->property(['is_active' => false, 'code' => '8', 'address' => '8 Off St']);

        $this->from('/accommodation/concern')
            ->post('/accommodation/concern', ['name' => 'X', 'email' => 'x@example.com', 'property_id' => $inactive->id, 'message' => 'Hi'])
            ->assertSessionHasErrors(['property_id']);

        $this->from('/accommodation/concern')
            ->post('/accommodation/concern', ['name' => 'X', 'email' => 'x@example.com', 'property_id' => 999999, 'message' => 'Hi'])
            ->assertSessionHasErrors(['property_id']);
    }

    public function test_portal_index_lists_concerns_with_status_and_team(): void
    {
        $prop = $this->property(['address' => '9 King St']);
        $tenant = $this->tenant($prop, ['email' => 'k@example.com', 'first_name' => 'Kay']);
        $this->concern($prop, ['tenant_id' => $tenant->id]);

        $this->actingAs($this->staff())->get('/portal/accommodation/concerns')
            ->assertInertia(fn (AssertInertia $page) => $page
                ->component('portal/accommodation/Concerns')
                ->has('concerns', 1)
                ->where('concerns.0.property_address', '9 King St')
                ->where('concerns.0.tenant_name', 'Kay Doe')
                ->where('concerns.0.status', 'new')
                ->has('statuses')
                ->has('team'));
    }

    public function test_staff_can_update_status_and_assignee(): void
    {
        $prop = $this->property();
        $c = $this->concern($prop);
        $assignee = $this->staff();

        $this->actingAs($this->staff())
            ->from('/portal/accommodation/concerns')
            ->patch("/portal/accommodation/concerns/{$c->id}", ['status' => 'investigating', 'assigned_to_user_id' => $assignee->id])
            ->assertRedirect();

        $fresh = $c->fresh();
        $this->assertEquals('investigating', $fresh->status);
        $this->assertEquals($assignee->id, $fresh->assigned_to_user_id);
    }

    public function test_update_rejects_invalid_status(): void
    {
        $prop = $this->property();
        $c = $this->concern($prop);

        $this->actingAs($this->staff())
            ->from('/portal/accommodation/concerns')
            ->patch("/portal/accommodation/concerns/{$c->id}", ['status' => 'bogus'])
            ->assertSessionHasErrors(['status']);
    }
}
