<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\RentPayment;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RentPaymentModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_has_many_rent_payments_and_cascade_deletes(): void
    {
        $property = Property::create([
            'name' => 'Test House', 'rent_single' => 200, 'status' => 'available',
            'is_active' => true, 'total_rooms' => 4, 'code' => '1', 'address' => '1 Test St',
        ]);
        $tenant = Tenant::create([
            'property_id' => $property->id, 'first_name' => 'Jane', 'family_name' => 'Doe',
            'contract_type' => 'fixed_term', 'contract_start' => '2026-01-01', 'current_status' => 'active',
            'weekly_rent_nzd' => 350, 'weekly_utilities_nzd' => 40,
        ]);

        $payment = RentPayment::create([
            'tenant_id' => $tenant->id, 'week_start' => '2026-06-15', 'amount_nzd' => 390,
        ]);

        $this->assertTrue($tenant->rentPayments()->whereKey($payment->id)->exists());
        $this->assertEquals($tenant->id, $payment->tenant->id);

        $tenant->forceDelete();
        $this->assertDatabaseMissing('accommodation_rent_payments', ['id' => $payment->id]);
    }
}
