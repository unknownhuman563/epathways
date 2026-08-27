<?php

namespace Tests\Feature\Leads;

use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Per-lead ad-hoc "Add document" on the Documents tab: scoped to the one lead,
 * uploaded against by a custom.* key, and removable without losing files.
 */
class CustomDocumentTest extends TestCase
{
    use RefreshDatabase;

    private function lead(string $name = 'A'): Lead
    {
        return Lead::create(['first_name' => $name, 'last_name' => 'Lead', 'status' => 'Submitted']);
    }

    public function test_add_custom_document_scopes_to_one_lead(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $a = $this->lead('A');
        $b = $this->lead('B');

        $this->post("/admin/leads/{$a->id}/documents/custom", [
            'name' => 'Marriage Certificate',
            'section' => 'Personal Documents',
        ])->assertRedirect();

        $items = $a->fresh()->custom_documents;
        $this->assertCount(1, $items);
        $this->assertSame('Marriage Certificate', $items[0]['name']);
        $this->assertSame('Personal Documents', $items[0]['section']);
        $this->assertStringStartsWith('custom.', $items[0]['key']);

        // The other lead is untouched — nobody else sees it.
        $this->assertNull($b->fresh()->custom_documents);
    }

    public function test_section_defaults_to_additional_documents(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $a = $this->lead();

        $this->post("/admin/leads/{$a->id}/documents/custom", ['name' => 'Extra Thing'])
            ->assertRedirect();

        $this->assertSame('Additional Documents', $a->fresh()->custom_documents[0]['section']);
    }

    public function test_duplicate_creates_a_second_distinct_row(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $a = $this->lead();

        // Add, then "duplicate" = post the same name + section again.
        $this->post("/admin/leads/{$a->id}/documents/custom", ['name' => 'Bank Statement', 'section' => 'Personal Documents']);
        $this->post("/admin/leads/{$a->id}/documents/custom", ['name' => 'Bank Statement', 'section' => 'Personal Documents']);

        $items = $a->fresh()->custom_documents;
        $this->assertCount(2, $items);
        // Same name + folder, but distinct keys so uploads don't collide.
        $this->assertSame('Bank Statement', $items[0]['name']);
        $this->assertSame('Bank Statement', $items[1]['name']);
        $this->assertNotSame($items[0]['key'], $items[1]['key']);
    }

    public function test_add_requires_a_name(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $a = $this->lead();

        $this->post("/admin/leads/{$a->id}/documents/custom", ['name' => ''])
            ->assertSessionHasErrors('name');
    }

    public function test_remove_custom_document_keeps_uploaded_files_as_orphans(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $a = $this->lead();

        $this->post("/admin/leads/{$a->id}/documents/custom", ['name' => 'Marriage Certificate']);
        $key = $a->fresh()->custom_documents[0]['key'];

        // A file uploaded against the custom item.
        $doc = LeadDocument::create([
            'lead_id' => $a->id,
            'checklist_key' => $key,
            'original_name' => 'cert.pdf',
            'file_path' => "enrolment-docs/{$a->lead_id}/cert.pdf",
            'status' => LeadDocument::STATUS_SUBMITTED,
            'source' => LeadDocument::SOURCE_UPLOAD,
        ]);

        $this->delete("/admin/leads/{$a->id}/documents/custom/{$key}")->assertRedirect();

        // Item gone …
        $this->assertNull($a->fresh()->custom_documents);
        // … but the uploaded file is kept, just decoupled (checklist_key nulled).
        $this->assertNull($doc->fresh()->checklist_key);
        $this->assertNotNull(LeadDocument::find($doc->id));
    }
}
