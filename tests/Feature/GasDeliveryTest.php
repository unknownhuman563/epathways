<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as AssertInertia;
use Tests\TestCase;

class GasDeliveryTest extends TestCase
{
    use RefreshDatabase;

    private function staff(): User
    {
        return User::factory()->create(['role' => 'accommodation']);
    }

    public function test_lists_active_properties_with_gas_fields(): void
    {
        Property::create([
            'name' => 'Gas House', 'rent_single' => 200, 'status' => 'available',
            'is_active' => true, 'total_rooms' => 4, 'code' => '3', 'address' => '3 Gas Rd',
            'uses_bottled_gas' => true, 'last_gas_purchase' => '2026-06-01',
        ]);

        $this->actingAs($this->staff())->get('/portal/accommodation/gas-delivery')
            ->assertInertia(fn (AssertInertia $page) => $page
                ->component('portal/accommodation/GasDelivery')
                ->has('properties', 1)
                ->where('properties.0.address', '3 Gas Rd')
                ->where('properties.0.uses_bottled_gas', true)
                ->where('properties.0.last_gas_purchase', '2026-06-01'));
    }

    public function test_excludes_inactive_properties(): void
    {
        Property::create([
            'name' => 'Inactive', 'rent_single' => 200, 'status' => 'available',
            'is_active' => false, 'total_rooms' => 4, 'code' => '4', 'address' => '4 Gas Rd',
        ]);

        $this->actingAs($this->staff())->get('/portal/accommodation/gas-delivery')
            ->assertInertia(fn (AssertInertia $page) => $page->has('properties', 0));
    }
}
