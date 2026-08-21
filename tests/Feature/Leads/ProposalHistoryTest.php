<?php

namespace Tests\Feature\Leads;

use App\Models\Lead;
use App\Models\LeadProposal;
use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Proposal version history: creating a new proposal must NOT discard the
 * previous one. Each non-empty save snapshots to lead_proposals while the
 * lead's active proposed_program_ids tracks the latest (what the tracker shows).
 */
class ProposalHistoryTest extends TestCase
{
    use RefreshDatabase;

    private function program(string $title): Program
    {
        return Program::create([
            'title' => $title,
            'slug' => \Illuminate\Support\Str::slug($title),
            'level' => '7',
            'location' => 'Auckland',
            'category' => 'Bachelors',
            'status' => 'published',
        ]);
    }

    public function test_new_proposal_keeps_previous_versions(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));

        $lead = Lead::create(['first_name' => 'Prop', 'last_name' => 'Lead', 'status' => 'Consultation Done']);
        $a = $this->program('Bachelor of Accounting');
        $b = $this->program('Bachelor of Nursing');
        $c = $this->program('Bachelor of IT');

        // First proposal.
        $this->post("/admin/leads/{$lead->id}/proposal", ['program_ids' => [$a->id, $b->id]])
            ->assertRedirect();

        // Second proposal — a completely different set.
        $this->post("/admin/leads/{$lead->id}/proposal", ['program_ids' => [$c->id]])
            ->assertRedirect();

        // Both versions are kept in history …
        $this->assertSame(2, LeadProposal::where('lead_id', $lead->id)->count());

        // … the active shortlist is the latest one …
        $this->assertSame([$c->id], $lead->fresh()->proposed_program_ids);

        // … and the newest history row matches the active set.
        $latest = LeadProposal::where('lead_id', $lead->id)->latest()->first();
        $this->assertSame([$c->id], $latest->program_ids);
    }

    public function test_legacy_active_proposal_is_preserved_on_first_new_save(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));

        $a = $this->program('Bachelor of Accounting');
        $b = $this->program('Bachelor of Nursing');

        // Legacy lead: an active proposal already exists with NO history rows
        // (it predates versioning).
        $lead = Lead::create([
            'first_name' => 'Legacy', 'last_name' => 'Lead', 'status' => 'Consultation Done',
            'proposed_program_ids' => [$a->id],
        ]);
        $this->assertSame(0, LeadProposal::where('lead_id', $lead->id)->count());

        // First versioned save replaces it — the old set must be kept.
        $this->post("/admin/leads/{$lead->id}/proposal", ['program_ids' => [$b->id]])
            ->assertRedirect();

        $history = LeadProposal::where('lead_id', $lead->id)->orderBy('id')->pluck('program_ids')->all();
        $this->assertCount(2, $history);
        $this->assertSame([$a->id], $history[0]); // backfilled legacy proposal
        $this->assertSame([$b->id], $history[1]); // the new one
        $this->assertSame([$b->id], $lead->fresh()->proposed_program_ids);
    }

    public function test_clearing_does_not_add_a_history_row(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));

        $lead = Lead::create(['first_name' => 'Prop', 'last_name' => 'Lead', 'status' => 'Consultation Done']);
        $a = $this->program('Bachelor of Accounting');

        $this->post("/admin/leads/{$lead->id}/proposal", ['program_ids' => [$a->id]])->assertRedirect();
        $this->post("/admin/leads/{$lead->id}/proposal", ['program_ids' => []])->assertRedirect();

        // The clear resets the active shortlist but keeps the one real version.
        $this->assertNull($lead->fresh()->proposed_program_ids);
        $this->assertSame(1, LeadProposal::where('lead_id', $lead->id)->count());
    }
}
