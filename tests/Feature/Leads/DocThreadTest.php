<?php

namespace Tests\Feature\Leads;

use App\Models\CaseThread;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The lead-profile Documents tab reuses the immigration CaseThread system for
 * per-document notes on general/education leads, anchored by checklist_key.
 */
class DocThreadTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_post_a_document_note(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'education']));
        $lead = Lead::create(['first_name' => 'A', 'last_name' => 'L', 'status' => 'New Leads']);

        $this->post("/admin/leads/{$lead->id}/threads", [
            'anchor_type' => 'document',
            'anchor_key' => 'pers.passport',
            'body' => 'Passport copy is blurry — please re-upload.',
            'client_visible' => true,
        ])->assertRedirect();

        $thread = CaseThread::where('lead_id', $lead->id)->first();
        $this->assertNotNull($thread);
        $this->assertSame('document', $thread->anchor_type);
        $this->assertSame('pers.passport', $thread->anchor_key);
        $this->assertTrue((bool) $thread->client_visible);
    }

    public function test_reply_inherits_parent_anchor_and_resolve_marks_answered(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);
        $lead = Lead::create(['first_name' => 'A', 'last_name' => 'L', 'status' => 'New Leads']);

        $root = CaseThread::create([
            'lead_id' => $lead->id, 'anchor_type' => 'document', 'anchor_key' => 'acad.cv',
            'author_id' => $user->id, 'body' => 'Question?', 'requires_answer' => true,
        ]);

        $this->post("/admin/leads/{$lead->id}/threads", [
            'parent_id' => $root->id,
            'anchor_type' => 'document',
            'anchor_key' => 'acad.cv',
            'body' => 'Answer.',
        ])->assertRedirect();

        $reply = CaseThread::where('parent_id', $root->id)->first();
        $this->assertNotNull($reply);
        $this->assertSame('acad.cv', $reply->anchor_key);

        $this->post("/admin/leads/{$lead->id}/threads/{$root->id}/resolve")->assertRedirect();
        $this->assertNotNull($root->fresh()->resolved_at);
    }

    public function test_note_thread_is_scoped_to_its_lead(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);
        $leadA = Lead::create(['first_name' => 'A', 'last_name' => 'L', 'status' => 'New Leads']);
        $leadB = Lead::create(['first_name' => 'B', 'last_name' => 'L', 'status' => 'New Leads']);
        $thread = CaseThread::create([
            'lead_id' => $leadA->id, 'anchor_type' => 'document', 'anchor_key' => 'acad.cv',
            'author_id' => $user->id, 'body' => 'x',
        ]);

        // Resolving via the wrong lead must 404 (row-level scoping).
        $this->post("/admin/leads/{$leadB->id}/threads/{$thread->id}/resolve")->assertNotFound();
    }
}
