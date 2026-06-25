<?php

namespace Tests\Feature\Immigration;

use App\Models\User;
use App\Models\VisaType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class VisaTypesPageTest extends TestCase
{
    use RefreshDatabase;

    private function immigrationUser(): User
    {
        return User::factory()->create(['role' => 'immigration']);
    }

    public function test_visa_types_page_renders_with_no_visa_types(): void
    {
        // Edge case: an empty catalogue. The page must still return 200 and
        // hand the React component an array (so the guarded .map()/.length
        // never see undefined).
        $this->actingAs($this->immigrationUser())
            ->get('/portal/immigration/visa-types')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('portal/immigration/VisaTypes')
                ->where('visaTypes', [])
                ->has('permissions')
            );
    }

    public function test_visa_types_page_always_provides_both_props(): void
    {
        VisaType::create([
            'code'                          => 'TESTVISA',
            'name'                          => 'Test Visa',
            'category'                      => 'work',
            'consultation_price_nzd'        => 250,
            'consultation_duration_minutes' => 30,
            'estimated_minutes'             => 15,
            'icon'                          => 'Globe',
            'active'                        => true,
        ]);

        $this->actingAs($this->immigrationUser())
            ->get('/portal/immigration/visa-types')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('portal/immigration/VisaTypes')
                ->has('visaTypes', 1)
                ->has('permissions.canCreate')
                ->has('permissions.canUpdate')
                ->has('permissions.canDelete')
            );
    }
}
