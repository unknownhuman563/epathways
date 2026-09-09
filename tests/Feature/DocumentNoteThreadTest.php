<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentNoteThreadTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_add_reply_and_action_a_document_note(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'name' => 'R. Patel']);
        $lead = Lead::create(['first_name' => 'A', 'last_name' => 'B']);
        $doc = LeadDocument::create([
            'lead_id' => $lead->id, 'checklist_key' => 'agree.consultancy',
            'original_name' => 'CA.pdf', 'file_path' => 'x/ca.pdf', 'source' => 'generated',
        ]);

        $this->actingAs($admin)->post("/admin/documents/{$doc->id}/notes", ['body' => 'Check the fee'])->assertRedirect();
        $notes = $doc->refresh()->notes;
        $this->assertCount(1, $notes);
        $this->assertSame('R. Patel', $notes[0]['author']);
        $noteId = $notes[0]['id'];

        $this->actingAs($admin)->post("/admin/documents/{$doc->id}/notes/{$noteId}/reply", ['body' => 'Done'])->assertRedirect();
        $this->actingAs($admin)->post("/admin/documents/{$doc->id}/notes/{$noteId}/actioned")->assertRedirect();

        $note = $doc->refresh()->notes[0];
        $this->assertCount(1, $note['replies']);
        $this->assertNotNull($note['actioned_at']);
    }
}
