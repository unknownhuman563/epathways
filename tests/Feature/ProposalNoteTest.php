<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Threaded per-programme notes for the Proposals review inbox — add, reply,
 * and toggle "actioned". Stored inside leads.proposed_program_meta.
 */
class ProposalNoteTest extends TestCase
{
    use RefreshDatabase;

    private function setup2(): array
    {
        $user = User::factory()->create(['role' => 'super_admin', 'name' => 'R. Patel']);
        $prog = Program::create(['title' => 'Bachelor of Accounting', 'level' => 7, 'category' => 'bachelors', 'status' => 'published']);
        $lead = Lead::create([
            'first_name' => 'Sofia', 'last_name' => 'Rossi',
            'proposed_program_ids' => [$prog->id],
        ]);

        return [$user, $lead, $prog];
    }

    public function test_staff_can_add_a_note_to_a_programme(): void
    {
        [$user, $lead, $prog] = $this->setup2();

        $this->actingAs($user)
            ->post("/admin/leads/{$lead->id}/program-notes/{$prog->id}", ['body' => 'Fee confirmed with Wintec.'])
            ->assertRedirect();

        $notes = $lead->refresh()->proposed_program_meta[(string) $prog->id]['notes'];
        $this->assertCount(1, $notes);
        $this->assertSame('Fee confirmed with Wintec.', $notes[0]['body']);
        $this->assertSame('note', $notes[0]['tag']);
        $this->assertSame('R. Patel', $notes[0]['author']);
        $this->assertNull($notes[0]['actioned_at']);
    }

    public function test_staff_can_reply_and_mark_actioned(): void
    {
        [$user, $lead, $prog] = $this->setup2();

        $this->actingAs($user)->post("/admin/leads/{$lead->id}/program-notes/{$prog->id}", ['body' => 'Please swap the campus.', 'tag' => 'change_requested']);
        $noteId = $lead->refresh()->proposed_program_meta[(string) $prog->id]['notes'][0]['id'];

        $this->actingAs($user)->post("/admin/leads/{$lead->id}/program-notes/{$prog->id}/{$noteId}/reply", ['body' => 'Done — updated to Hamilton.'])->assertRedirect();
        $this->actingAs($user)->post("/admin/leads/{$lead->id}/program-notes/{$prog->id}/{$noteId}/actioned")->assertRedirect();

        $note = $lead->refresh()->proposed_program_meta[(string) $prog->id]['notes'][0];
        $this->assertCount(1, $note['replies']);
        $this->assertSame('Done — updated to Hamilton.', $note['replies'][0]['body']);
        $this->assertNotNull($note['actioned_at']);

        // Toggle back off.
        $this->actingAs($user)->post("/admin/leads/{$lead->id}/program-notes/{$prog->id}/{$noteId}/actioned")->assertRedirect();
        $this->assertNull($lead->refresh()->proposed_program_meta[(string) $prog->id]['notes'][0]['actioned_at']);
    }

    public function test_note_on_a_programme_not_in_the_shortlist_is_rejected(): void
    {
        [$user, $lead] = $this->setup2();
        $other = Program::create(['title' => 'Other', 'level' => 7, 'category' => 'bachelors', 'status' => 'published']);

        $this->actingAs($user)
            ->post("/admin/leads/{$lead->id}/program-notes/{$other->id}", ['body' => 'nope'])
            ->assertNotFound();
    }
}
