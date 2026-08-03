<?php

namespace Tests\Feature\Immigration;

use App\Models\Lead;
use App\Models\User;
use App\Notifications\CaseHandedOff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Build 12 phase 2 — case custody. Handoff carries a note and notifies;
 * self-handoff is a claim; staleness is measured on last activity, not on how
 * long the owner has held the case.
 */
class CaseCustodyTest extends TestCase
{
    use RefreshDatabase;

    private function immigrationUser(string $name = 'Emma Staff'): User
    {
        return User::factory()->create(['role' => 'immigration', 'name' => $name]);
    }

    private function caseLead(): Lead
    {
        return Lead::create([
            'first_name' => 'Aroha', 'last_name' => 'Ngata',
            'email' => 'aroha@example.test', 'is_immigration_case' => true,
            'inz_visa_type' => 'Student Visa',
        ]);
    }

    public function test_handoff_sets_owner_records_note_and_notifies(): void
    {
        Notification::fake();
        $from = $this->immigrationUser('Emma');
        $to = $this->immigrationUser('Hemi');
        $case = $this->caseLead();

        $this->actingAs($from)
            ->from('/portal/immigration/cases')
            ->post("/portal/immigration/cases/{$case->id}/handoff", [
                'to_user_id' => $to->id,
                'note' => 'Client is waiting on the medical certificate — chase it.',
            ])
            ->assertRedirect();

        $fresh = $case->fresh();
        $this->assertSame($to->id, $fresh->current_owner_id);
        $this->assertNotNull($fresh->owner_since);

        // The note lands as a case note...
        $this->assertDatabaseHas('lead_notes', [
            'lead_id' => $case->id,
            'kind' => 'handoff',
        ]);
        // ...and the new owner is notified.
        Notification::assertSentTo($to, CaseHandedOff::class);
        // ...and it's audited.
        $this->assertDatabaseHas('activity_logs', ['action' => 'case.handoff']);
    }

    public function test_claiming_assigns_to_self_and_does_not_notify(): void
    {
        Notification::fake();
        $me = $this->immigrationUser('Emma');
        $case = $this->caseLead();

        $this->actingAs($me)
            ->post("/portal/immigration/cases/{$case->id}/handoff", [
                'to_user_id' => $me->id,
            ])
            ->assertRedirect();

        $this->assertSame($me->id, $case->fresh()->current_owner_id);
        // You don't get notified when you claim.
        Notification::assertNotSentTo($me, CaseHandedOff::class);
    }

    public function test_handoff_rejects_a_non_immigration_user(): void
    {
        $from = $this->immigrationUser();
        $sales = User::factory()->create(['role' => 'sales']);
        $case = $this->caseLead();

        $this->actingAs($from)
            ->from('/portal/immigration/cases')
            ->post("/portal/immigration/cases/{$case->id}/handoff", [
                'to_user_id' => $sales->id,
            ])
            ->assertSessionHasErrors('to_user_id');

        $this->assertNull($case->fresh()->current_owner_id);
    }

    public function test_cases_board_flags_a_stuck_case_by_last_activity(): void
    {
        $me = $this->immigrationUser();
        $case = $this->caseLead();
        // Untouched for 12 days → past the red threshold (10). Ownership age is
        // irrelevant — staleness is about last activity.
        $case->forceFill(['last_activity_at' => now()->subDays(12), 'owner_since' => now()])->saveQuietly();

        $this->actingAs($me)
            ->get('/portal/immigration/cases')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->where('cases.0.custody_stale', 'red')
                ->has('me_id')
                ->has('staff')
            );
    }
}
