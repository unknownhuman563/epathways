<?php

namespace Tests\Feature\Immigration;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Staff can set the planned filing date (target_lodgement_at) and the applicant
 * IRD number from the case Personal tab, and both surface on the case profile.
 */
class CaseTargetLodgementIrdTest extends TestCase
{
    use RefreshDatabase;

    public function test_target_lodgement_and_ird_number_save_and_serialise(): void
    {
        $staff = User::factory()->create(['role' => 'immigration']);
        $lead = Lead::create([
            'first_name' => 'Ana', 'last_name' => 'Cruz', 'email' => 'ana@example.com',
            'is_immigration_case' => true,
        ]);

        $this->actingAs($staff)->post("/portal/immigration/cases/{$lead->id}/personal", [
            'first_name' => 'Ana', 'email' => 'ana@example.com',
            'target_lodgement_at' => '2026-10-15',
            'ird_number' => '123-456-789',
        ])->assertSessionHasNoErrors();

        $fresh = $lead->fresh();
        $this->assertSame('2026-10-15', $fresh->target_lodgement_at->format('Y-m-d'));
        $this->assertSame('123-456-789', $fresh->ird_number);

        $this->actingAs($staff)->get("/portal/immigration/cases/{$lead->id}/profile")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('lead.target_lodgement_at', '2026-10-15')
                ->where('lead.ird_number', '123-456-789'));
    }
}
