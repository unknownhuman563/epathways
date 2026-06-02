<?php

namespace Tests\Feature;

use App\Models\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AccommodationPublicTest extends TestCase
{
    use RefreshDatabase;

    private function make(array $overrides = []): Property
    {
        return Property::create(array_merge([
            'name' => 'Test House',
            'location' => 'Auckland, NZ',
            'room_type' => 'single',
            'has_wardrobe' => true,
            'bed_type' => 'single',
            'bathroom_type' => 'shared',
            'includes' => 'Shared kitchen.',
            'rent_single' => 250,
            'rent_couple' => 300,
            'bills_excluded' => true,
            'status' => 'available',
        ], $overrides));
    }

    public function test_public_index_shows_only_available_properties(): void
    {
        $this->make();
        $this->make(['name' => 'Hidden House', 'status' => 'unavailable']);

        $this->get('/accommodation')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('accommodation/AccommodationPage')
                ->has('properties', 1));
    }

    public function test_show_returns_available_property(): void
    {
        $property = $this->make();

        $this->get("/accommodation/{$property->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('accommodation/PropertyDetails')
                ->where('property.id', $property->id));
    }

    public function test_show_404s_for_unavailable_property(): void
    {
        $property = $this->make(['status' => 'unavailable']);

        $this->get("/accommodation/{$property->id}")->assertNotFound();
    }
}
