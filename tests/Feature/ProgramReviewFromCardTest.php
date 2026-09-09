<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The "Programs offered" card review modal: verified/rejected + remarks +
 * amount, saved onto leads.proposed_program_meta (shared with verification).
 */
class ProgramReviewFromCardTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_review_a_shortlisted_program(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $prog = Program::create(['title' => 'Bachelor of X', 'level' => 7, 'category' => 'bachelors', 'status' => 'published']);
        $lead = Lead::create(['first_name' => 'A', 'last_name' => 'B', 'proposed_program_ids' => [$prog->id]]);

        $this->actingAs($admin)
            ->post("/admin/leads/{$lead->id}/programs/{$prog->id}/review", [
                'status' => 'verified', 'remarks' => 'Fee confirmed with school', 'amount' => 180000,
            ])->assertRedirect();

        $m = $lead->refresh()->proposed_program_meta[(string) $prog->id];
        $this->assertSame('verified', $m['status']);
        $this->assertSame('Fee confirmed with school', $m['note']);
        $this->assertSame(180000, $m['fee']);
        $this->assertTrue($m['fee_confirmed']);
        $this->assertTrue($m['edited']);
    }

    public function test_reject_sets_status_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $prog = Program::create(['title' => 'Y', 'level' => 7, 'category' => 'bachelors', 'status' => 'published']);
        $lead = Lead::create(['first_name' => 'A', 'last_name' => 'B', 'proposed_program_ids' => [$prog->id]]);

        $this->actingAs($admin)
            ->post("/admin/leads/{$lead->id}/programs/{$prog->id}/review", ['status' => 'rejected'])
            ->assertRedirect();

        $this->assertSame('rejected', $lead->refresh()->proposed_program_meta[(string) $prog->id]['status']);
    }

    public function test_program_not_on_shortlist_is_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $prog = Program::create(['title' => 'Z', 'level' => 7, 'category' => 'bachelors', 'status' => 'published']);
        $lead = Lead::create(['first_name' => 'A', 'last_name' => 'B', 'proposed_program_ids' => []]);

        $this->actingAs($admin)
            ->post("/admin/leads/{$lead->id}/programs/{$prog->id}/review", ['status' => 'verified'])
            ->assertNotFound();
    }
}
