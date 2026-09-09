<?php

namespace Tests\Feature\Portal;

use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Documents the adviser shares with the client (RFI letters, outcome letters —
 * StaffShared) must be visible on the client portal dashboard + Documents page
 * and be viewable/downloadable there. Previously there was no route, so the
 * client hit a 404.
 */
class LeadPortalSharedDocumentsTest extends TestCase
{
    use RefreshDatabase;

    private function leadUser(): array
    {
        $lead = Lead::create(['first_name' => 'Client', 'last_name' => 'Portal']);
        $user = User::factory()->create(['role' => 'lead', 'lead_id' => $lead->id]);

        return [$lead, $user];
    }

    private function sharedRfiDoc(Lead $lead): LeadDocument
    {
        Storage::fake('local');
        $path = "lead-documents/{$lead->id}/rfi.pdf";
        Storage::disk('local')->put($path, '%PDF-1.4 fake');

        return LeadDocument::create([
            'lead_id' => $lead->id,
            'original_name' => 'RFI Letter.pdf',
            'file_path' => $path,
            'mime' => 'application/pdf',
            'size' => 13,
            'source' => 'upload',
            'source_variant' => 'rfi',
            'status' => LeadDocument::STATUS_STAFF_SHARED,
        ]);
    }

    public function test_dashboard_and_checklist_list_shared_documents(): void
    {
        [$lead, $user] = $this->leadUser();
        $this->sharedRfiDoc($lead);

        $this->actingAs($user)->get('/portal/lead/dashboard')->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('sharedDocuments.0.title', 'RFI Letter.pdf')
                ->where('sharedDocuments.0.download_url', fn ($u) => str_contains($u, '/documents/'))
            );

        $this->actingAs($user)->get('/portal/lead/checklist')->assertOk()
            ->assertInertia(fn ($page) => $page->where('sharedDocuments.0.title', 'RFI Letter.pdf'));

        // The main Documents page already surfaces staff-shared docs.
        $this->actingAs($user)->get('/portal/lead/documents')->assertOk()
            ->assertInertia(fn ($page) => $page->where('shared_by_staff.0.original_name', 'RFI Letter.pdf'));
    }

    public function test_client_can_download_a_shared_document(): void
    {
        [$lead, $user] = $this->leadUser();
        $doc = $this->sharedRfiDoc($lead);

        $this->actingAs($user)->get("/portal/lead/documents/{$doc->id}/download")->assertOk();
        $this->actingAs($user)->get("/portal/lead/documents/{$doc->id}/download?inline=1")->assertOk();
    }

    public function test_cannot_download_another_leads_document(): void
    {
        [, $user] = $this->leadUser();
        $other = Lead::create(['first_name' => 'Other', 'last_name' => 'Lead']);
        $otherDoc = $this->sharedRfiDoc($other);

        // The shared client download route (LeadDocumentController@download)
        // scopes to the caller's own lead — another lead's doc is forbidden.
        $this->actingAs($user)->get("/portal/lead/documents/{$otherDoc->id}/download")->assertForbidden();
    }
}
