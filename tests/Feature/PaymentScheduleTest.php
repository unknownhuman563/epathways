<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as AssertInertia;
use Tests\TestCase;

class PaymentScheduleTest extends TestCase
{
    use RefreshDatabase;

    private function staff(): User
    {
        return User::factory()->create(['role' => 'accommodation']);
    }

    public function test_lists_property_manager_details_and_schedule(): void
    {
        Property::create([
            'name' => 'Mt Roskill Student House', 'rent_single' => 200, 'status' => 'available',
            'is_active' => true, 'total_rooms' => 4, 'code' => '7', 'address' => '7 Test Rd',
            'property_manager_name' => 'John', 'property_manager_phone' => '3495783',
            'property_manager_email' => 'john@email.com', 'pm_payment_schedule' => 'Every Friday',
        ]);

        $this->actingAs($this->staff())->get('/portal/accommodation/payment-schedule')
            ->assertInertia(fn (AssertInertia $page) => $page
                ->component('portal/accommodation/PaymentSchedule')
                ->has('properties', 1)
                ->where('properties.0.address', '7 Test Rd')
                ->where('properties.0.manager_name', 'John')
                ->where('properties.0.manager_phone', '3495783')
                ->where('properties.0.manager_email', 'john@email.com')
                ->where('properties.0.payment_schedule', 'Every Friday'));
    }

    public function test_excludes_inactive_properties(): void
    {
        Property::create([
            'name' => 'Hidden House', 'rent_single' => 200, 'status' => 'available',
            'is_active' => false, 'total_rooms' => 4, 'code' => '8', 'address' => '8 Test Rd',
        ]);

        $this->actingAs($this->staff())->get('/portal/accommodation/payment-schedule')
            ->assertInertia(fn (AssertInertia $page) => $page->has('properties', 0));
    }
}
