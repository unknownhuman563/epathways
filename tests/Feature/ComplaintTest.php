<?php

namespace Tests\Feature;

use App\Models\Complaint;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as AssertInertia;
use Tests\TestCase;

class ComplaintTest extends TestCase
{
    use RefreshDatabase;

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

    public function test_public_form_renders(): void
    {
        $this->get('/accommodation/complaint')
            ->assertInertia(fn (AssertInertia $p) => $p->component('accommodation/Complaint'));
    }

    public function test_store_matches_tenant_and_property_by_email_case_insensitively(): void
    {
        $prop = $this->property(['address' => '21 Vazey Way']);
        $tenant = $this->tenant($prop, ['email' => 'tenant@example.com']);

        $this->post('/accommodation/complaint', [
            'name' => 'Tenant Person', 'email' => 'TENANT@example.com', 'message' => 'Leaky tap',
        ])->assertRedirect('/accommodation/complaint');

        $this->assertDatabaseHas('accommodation_complaints', [
            'email' => 'TENANT@example.com', 'tenant_id' => $tenant->id, 'property_id' => $prop->id,
        ]);
    }

    public function test_store_unmatched_email_is_stored_without_property(): void
    {
        $this->post('/accommodation/complaint', [
            'name' => 'Random', 'email' => 'nobody@example.com', 'message' => 'Hi',
        ])->assertRedirect();

        $this->assertDatabaseHas('accommodation_complaints', [
            'email' => 'nobody@example.com', 'tenant_id' => null, 'property_id' => null,
        ]);
    }

    public function test_store_validates_required_fields(): void
    {
        $this->from('/accommodation/complaint')
            ->post('/accommodation/complaint', ['email' => 'not-an-email'])
            ->assertSessionHasErrors(['name', 'email', 'message']);
    }

    public function test_portal_index_lists_complaints_with_property_and_tenant(): void
    {
        $prop = $this->property(['address' => '9 King St']);
        $tenant = $this->tenant($prop, ['email' => 'k@example.com', 'first_name' => 'Kay']);
        Complaint::create([
            'name' => 'Kay', 'email' => 'k@example.com', 'message' => 'No hot water',
            'tenant_id' => $tenant->id, 'property_id' => $prop->id,
        ]);

        $staff = User::factory()->create(['role' => 'accommodation']);
        $this->actingAs($staff)->get('/portal/accommodation/complaints')
            ->assertInertia(fn (AssertInertia $p) => $p
                ->component('portal/accommodation/Complaints')
                ->has('complaints', 1)
                ->where('complaints.0.property_address', '9 King St')
                ->where('complaints.0.tenant_name', 'Kay Doe')
                ->where('complaints.0.message', 'No hot water'));
    }
}
