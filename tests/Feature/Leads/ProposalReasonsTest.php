<?php

namespace Tests\Feature\Leads;

use App\Models\Lead;
use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProposalReasonsTest extends TestCase
{
    use RefreshDatabase;

    private function program(string $title): Program
    {
        return Program::create([
            'title' => $title, 'level' => '7', 'category' => 'bachelors',
            'status' => 'published', 'location' => 'Auckland',
        ]);
    }

    public function test_proposal_saves_per_program_reasons(): void
    {
        $staff = User::factory()->create(['role' => 'admin']);
        $lead = Lead::create(['first_name' => 'A', 'last_name' => 'L', 'tracking_code' => 'RSN123']);
        $p1 = $this->program('Bachelor of Accounting');
        $p2 = $this->program('Bachelor of Business');

        $this->actingAs($staff)
            ->post("/admin/leads/{$lead->id}/proposal", [
                'program_ids' => [$p1->id, $p2->id],
                'reasons' => [
                    (string) $p1->id => 'Matches your accounting background.',
                    (string) $p2->id => '',   // blank → dropped
                ],
            ])
            ->assertRedirect();

        $lead->refresh();
        $this->assertSame([$p1->id, $p2->id], $lead->proposed_program_ids);
        $this->assertSame('Matches your accounting background.', $lead->proposed_program_reasons[(string) $p1->id]);
        $this->assertArrayNotHasKey((string) $p2->id, $lead->proposed_program_reasons ?? []);

        // Snapshotted onto the version too.
        $this->assertSame('Matches your accounting background.', $lead->proposals()->first()->reasons[(string) $p1->id]);
    }

    public function test_reason_shows_on_the_tracker(): void
    {
        $staff = User::factory()->create(['role' => 'admin']);
        $lead = Lead::create(['first_name' => 'A', 'last_name' => 'L', 'tracking_code' => 'RSN456']);
        $p1 = $this->program('Bachelor of Accounting');

        $this->actingAs($staff)->post("/admin/leads/{$lead->id}/proposal", [
            'program_ids' => [$p1->id],
            'reasons' => [(string) $p1->id => 'Strong graduate outcomes.'],
        ]);

        // Proposals now require approval before the tracker shows them.
        $lead->update(['proposal_review' => ['status' => 'approved']]);

        $this->get('/track/RSN456')
            ->assertOk()
            ->assertInertia(fn ($p) => $p
                ->where('proposal.programs.0.reason', 'Strong graduate outcomes.')
            );
    }

    public function test_reason_only_kept_for_shortlisted_programs(): void
    {
        $staff = User::factory()->create(['role' => 'admin']);
        $lead = Lead::create(['first_name' => 'A', 'last_name' => 'L', 'tracking_code' => 'RSN789']);
        $p1 = $this->program('Kept');
        $p2 = $this->program('Not shortlisted');

        $this->actingAs($staff)->post("/admin/leads/{$lead->id}/proposal", [
            'program_ids' => [$p1->id],
            'reasons' => [
                (string) $p1->id => 'keep me',
                (string) $p2->id => 'orphan reason',
            ],
        ]);

        $reasons = $lead->fresh()->proposed_program_reasons;
        $this->assertSame(['keep me'], array_values($reasons));
    }
}
