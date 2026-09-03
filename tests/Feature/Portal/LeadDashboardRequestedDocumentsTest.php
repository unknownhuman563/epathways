<?php

namespace Tests\Feature\Portal;

use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\LeadDocumentRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The client dashboard must surface documents the adviser requested that the
 * client still needs to act on (nothing uploaded, or the last upload rejected),
 * so it's the first thing they see — with a route to the Documents page.
 */
class LeadDashboardRequestedDocumentsTest extends TestCase
{
    use RefreshDatabase;

    private function leadUser(): array
    {
        $lead = Lead::create(['first_name' => 'Client', 'last_name' => 'Portal']);
        $user = User::factory()->create(['role' => 'lead', 'lead_id' => $lead->id]);

        return [$lead, $user];
    }

    public function test_dashboard_lists_outstanding_requested_documents(): void
    {
        [$lead, $user] = $this->leadUser();

        LeadDocumentRequest::create(['lead_id' => $lead->id, 'label' => 'Bank statement', 'required' => true, 'requested_at' => now()]);
        LeadDocumentRequest::create(['lead_id' => $lead->id, 'label' => 'Police certificate', 'required' => true, 'requested_at' => now()]);

        $this->actingAs($user)->get('/portal/lead/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('portal/lead/Dashboard')
                ->where('requestedDocuments.outstanding', 2)
                ->where('requestedDocuments.items.0.label', fn ($l) => in_array($l, ['Bank statement', 'Police certificate'], true)));
    }

    public function test_a_fulfilled_request_is_not_counted_as_outstanding(): void
    {
        [$lead, $user] = $this->leadUser();

        $req = LeadDocumentRequest::create(['lead_id' => $lead->id, 'label' => 'Passport', 'required' => true, 'requested_at' => now()]);
        // Client uploaded against it → no longer outstanding.
        LeadDocument::create([
            'lead_id' => $lead->id,
            'request_id' => $req->id,
            'original_name' => 'passport.pdf',
            'file_path' => 'x/passport.pdf',
            'status' => LeadDocument::STATUS_SUBMITTED,
        ]);

        // A second request the client hasn't touched stays outstanding.
        LeadDocumentRequest::create(['lead_id' => $lead->id, 'label' => 'CV', 'required' => true, 'requested_at' => now()]);

        $this->actingAs($user)->get('/portal/lead/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('requestedDocuments.total', 2)
                ->where('requestedDocuments.outstanding', 1)
                ->where('requestedDocuments.items.0.label', 'CV'));
    }

    public function test_a_rejected_upload_is_counted_as_outstanding_again(): void
    {
        [$lead, $user] = $this->leadUser();

        $req = LeadDocumentRequest::create(['lead_id' => $lead->id, 'label' => 'Payslip', 'required' => true, 'requested_at' => now()]);
        LeadDocument::create([
            'lead_id' => $lead->id,
            'request_id' => $req->id,
            'original_name' => 'payslip.pdf',
            'file_path' => 'x/payslip.pdf',
            'status' => LeadDocument::STATUS_REJECTED,
        ]);

        $this->actingAs($user)->get('/portal/lead/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('requestedDocuments.outstanding', 1)
                ->where('requestedDocuments.items.0.status', 'Rejected'));
    }
}
