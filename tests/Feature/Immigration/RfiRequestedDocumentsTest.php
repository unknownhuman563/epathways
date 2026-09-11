<?php

namespace Tests\Feature\Immigration;

use App\Models\Lead;
use App\Models\LeadDocumentRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * The documents INZ asks for in an RFI letter become document requests the
 * client uploads against (origin 'rfi'). Staff confirm the AI-read list in the
 * modal; the confirmed list is what this covers — creation, de-duplication, and
 * that it surfaces to the client portal.
 */
class RfiRequestedDocumentsTest extends TestCase
{
    use RefreshDatabase;

    private function case(): Lead
    {
        return Lead::create([
            'first_name' => 'Test', 'last_name' => 'Sample', 'email' => 'client@example.com',
            'is_immigration_case' => true, 'immigration_stage' => 'Endorsed', 'status' => 'Engaged',
        ]);
    }

    private function actAsStaff(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'immigration']));
    }

    public function test_confirmed_documents_become_rfi_requests(): void
    {
        Storage::fake('local');
        $this->actAsStaff();
        $case = $this->case();

        $this->post("/portal/immigration/cases/{$case->id}/rfi", [
            'deadline' => '2026-10-01',
            'notify' => 0,
            'requested_documents' => [
                ['label' => 'Updated bank statements', 'description' => 'Last 6 months', 'required' => 1],
                ['label' => 'Police certificate', 'required' => 0],
            ],
        ])->assertSessionHasNoErrors();

        $reqs = LeadDocumentRequest::where('lead_id', $case->id)->where('origin', 'rfi')->get();
        $this->assertCount(2, $reqs);
        $this->assertTrue($reqs->firstWhere('label', 'Updated bank statements')->required);
        $this->assertFalse($reqs->firstWhere('label', 'Police certificate')->required);
    }

    public function test_reopening_the_modal_does_not_duplicate_the_same_request(): void
    {
        Storage::fake('local');
        $this->actAsStaff();
        $case = $this->case();

        $payload = [
            'deadline' => '2026-10-01', 'notify' => 0,
            'requested_documents' => [['label' => 'Police certificate']],
        ];
        $this->post("/portal/immigration/cases/{$case->id}/rfi", $payload)->assertSessionHasNoErrors();
        // Same label again (case-insensitive) — must not create a second row.
        $this->post("/portal/immigration/cases/{$case->id}/rfi", [
            'deadline' => '2026-10-05', 'notify' => 0,
            'requested_documents' => [['label' => 'police CERTIFICATE']],
        ])->assertSessionHasNoErrors();

        $this->assertSame(1, LeadDocumentRequest::where('lead_id', $case->id)->where('origin', 'rfi')->count());
    }

    public function test_the_client_portal_sees_rfi_requests_grouped_by_origin(): void
    {
        $lead = Lead::create([
            'first_name' => 'Ana', 'last_name' => 'Cruz', 'email' => 'ana@example.com',
            'is_immigration_case' => true, 'immigration_stage' => 'Request for Information',
        ]);
        LeadDocumentRequest::create([
            'lead_id' => $lead->id, 'label' => 'Police certificate', 'required' => true,
            'origin' => 'rfi', 'requested_at' => now(),
        ]);
        $portalUser = User::factory()->create(['role' => 'lead', 'lead_id' => $lead->id]);

        $this->actingAs($portalUser)
            ->get('/portal/lead/documents')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('requests.0.origin', 'rfi')
                ->where('requests.0.label', 'Police certificate'));
    }

    public function test_staff_can_upload_a_requested_document_on_the_clients_behalf(): void
    {
        Storage::fake('local');
        $this->actAsStaff();
        $case = $this->case();
        $req = LeadDocumentRequest::create([
            'lead_id' => $case->id, 'label' => 'Income tax records', 'required' => true,
            'origin' => 'rfi', 'requested_at' => now(),
        ]);

        $this->post("/admin/leads/{$case->id}/documents/requests/{$req->id}/upload", [
            'files' => [UploadedFile::fake()->create('tax.pdf', 60, 'application/pdf')],
        ])->assertSessionHasNoErrors();

        // The file is tied to the request, so the request row now reads as fulfilled.
        $doc = \App\Models\LeadDocument::where('lead_id', $case->id)->where('request_id', $req->id)->first();
        $this->assertNotNull($doc);
        Storage::disk('local')->assertExists($doc->file_path);
        $this->assertTrue($req->fresh()->documents()->exists());
    }

    public function test_a_request_from_another_lead_cannot_be_uploaded_into(): void
    {
        Storage::fake('local');
        $this->actAsStaff();
        $mine = $this->case();
        $other = $this->case();
        $req = LeadDocumentRequest::create([
            'lead_id' => $other->id, 'label' => 'Passport', 'required' => true,
            'origin' => 'rfi', 'requested_at' => now(),
        ]);

        // The request belongs to $other — uploading it under $mine must 404.
        $this->post("/admin/leads/{$mine->id}/documents/requests/{$req->id}/upload", [
            'files' => [UploadedFile::fake()->create('p.pdf', 20, 'application/pdf')],
        ])->assertNotFound();
    }

    public function test_analyze_reports_no_text_for_a_non_readable_pdf(): void
    {
        Storage::fake('local');
        $this->actAsStaff();
        $case = $this->case();

        // A fake (empty) PDF has no extractable text → manual fallback signalled.
        $this->post("/portal/immigration/cases/{$case->id}/rfi/analyze", [
            'documents' => [UploadedFile::fake()->create('rfi-letter.pdf', 40, 'application/pdf')],
        ])
            ->assertOk()
            ->assertJson(['text_found' => false, 'ai_used' => false, 'documents' => []]);
    }
}
