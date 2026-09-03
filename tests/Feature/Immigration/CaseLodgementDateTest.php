<?php

namespace Tests\Feature\Immigration;

use App\Models\Lead;
use App\Models\User;
use App\Models\VisaType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Staff can set the INZ lodgement date from the case Personal tab, and the case
 * profile serialises the visa type's expected processing window so the Overview
 * can track days-in-processing vs the INZ expected outcome time.
 */
class CaseLodgementDateTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_save_the_lodgement_date_and_expected_window_is_exposed(): void
    {
        VisaType::create(['name' => 'Student Visa (Fee Paying)', 'code' => 'SVF', 'expected_processing_days' => 30]);

        $staff = User::factory()->create(['role' => 'immigration']);
        $lead = Lead::create([
            'first_name' => 'Sara', 'last_name' => 'Lee', 'email' => 'sara@example.com',
            'is_immigration_case' => true, 'inz_visa_type' => 'Student Visa (Fee Paying)',
        ]);

        // Set the lodgement date via the Personal-tab endpoint.
        $this->actingAs($staff)->post("/portal/immigration/cases/{$lead->id}/personal", [
            'first_name' => 'Sara', 'email' => 'sara@example.com',
            'inz_lodged_at' => '2026-08-01',
        ])->assertSessionHasNoErrors();

        $this->assertSame('2026-08-01', $lead->fresh()->inz_lodged_at->format('Y-m-d'));

        // The case profile exposes the lodged date + the visa's expected window.
        $this->actingAs($staff)->get("/portal/immigration/cases/{$lead->id}/profile")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('lead.inz_lodged_at', '2026-08-01')
                ->where('lead.expected_processing_days', 30));
    }
}
