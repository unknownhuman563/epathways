<?php

namespace Tests\Feature\Portal;

use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\LeadDocumentRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * The core of the "client uploads a requested document from their portal" flow:
 * a staff-created LeadDocumentRequest must be uploadable by the lead, land as a
 * Submitted LeadDocument tied to that request, and surface on the portal page.
 */
class LeadPortalRequestedDocumentUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_lead_uploads_against_a_requested_document_and_it_submits(): void
    {
        Storage::fake('local');

        $staff = User::factory()->create(['role' => 'immigration']);
        $lead = Lead::create(['first_name' => 'Portal', 'last_name' => 'Lead', 'assigned_to' => $staff->id]);
        $leadUser = User::factory()->create(['role' => 'lead', 'lead_id' => $lead->id]);

        $request = LeadDocumentRequest::create([
            'lead_id' => $lead->id,
            'label' => 'Bank statement',
            'required' => true,
            'requested_by' => $staff->id,
            'requested_at' => now(),
        ]);

        $this->actingAs($leadUser)->post('/portal/lead/documents/upload', [
            'file' => UploadedFile::fake()->create('bank.pdf', 120, 'application/pdf'),
            'request_id' => $request->id,
        ])->assertSessionHasNoErrors()->assertRedirect();

        // The upload persisted, is tied to the request, and is marked Submitted.
        $this->assertDatabaseHas('lead_documents', [
            'lead_id' => $lead->id,
            'request_id' => $request->id,
            'status' => LeadDocument::STATUS_SUBMITTED,
            'uploaded_by' => $leadUser->id,
        ]);

        $doc = LeadDocument::where('request_id', $request->id)->firstOrFail();
        Storage::disk('local')->assertExists($doc->file_path);
    }

    public function test_the_portal_documents_page_lists_the_request_for_upload(): void
    {
        $staff = User::factory()->create(['role' => 'immigration']);
        $lead = Lead::create(['first_name' => 'Portal', 'last_name' => 'Lead', 'assigned_to' => $staff->id]);
        $leadUser = User::factory()->create(['role' => 'lead', 'lead_id' => $lead->id]);

        LeadDocumentRequest::create([
            'lead_id' => $lead->id,
            'label' => 'Police certificate',
            'required' => true,
            'requested_by' => $staff->id,
            'requested_at' => now(),
        ]);

        $this->actingAs($leadUser)->get('/portal/lead/documents')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('portal/lead/Documents')
                ->has('requests', 1)
                ->where('requests.0.label', 'Police certificate'));
    }

    public function test_a_lead_cannot_upload_against_another_leads_request(): void
    {
        Storage::fake('local');

        $otherLead = Lead::create(['first_name' => 'Someone', 'last_name' => 'Else']);
        $otherRequest = LeadDocumentRequest::create([
            'lead_id' => $otherLead->id,
            'label' => 'Not yours',
            'required' => true,
            'requested_at' => now(),
        ]);

        $lead = Lead::create(['first_name' => 'Portal', 'last_name' => 'Lead']);
        $leadUser = User::factory()->create(['role' => 'lead', 'lead_id' => $lead->id]);

        $this->actingAs($leadUser)->post('/portal/lead/documents/upload', [
            'file' => UploadedFile::fake()->create('x.pdf', 50, 'application/pdf'),
            'request_id' => $otherRequest->id,
        ])->assertForbidden();

        $this->assertDatabaseMissing('lead_documents', ['request_id' => $otherRequest->id]);
    }
}
