<?php

namespace Tests\Feature\Leads;

use App\Http\Controllers\LeadDocumentController;
use App\Jobs\SendLeadFollowupEmail;
use App\Models\Lead;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ProposalFollowupTest extends TestCase
{
    use RefreshDatabase;

    public function test_proposal_send_schedules_the_drip_even_when_already_in_proposal_sent(): void
    {
        Queue::fake();

        // Regression: a lead already in "Proposal Sent" when the proposal is
        // actually emailed (verification-approval flow) previously never got the
        // drip, because it hung off the status transition that never happened.
        $lead = Lead::create([
            'first_name' => 'Isha', 'last_name' => 'Bhasin', 'email' => 'isha@example.com',
            'tracking_code' => 'PF001', 'status' => 'Proposal Sent',
        ]);

        app(LeadDocumentController::class)->sendProposalReadyEmail($lead, false);

        Queue::assertPushed(SendLeadFollowupEmail::class, 3);
        foreach (['proposal_send_1', 'proposal_send_2', 'proposal_send_3'] as $key) {
            Queue::assertPushed(SendLeadFollowupEmail::class, fn ($job) => $job->templateKey === $key && $job->requireStatus === 'Proposal Sent');
        }
    }

    public function test_no_drip_when_the_lead_has_no_email(): void
    {
        Queue::fake();
        $lead = Lead::create([
            'first_name' => 'No', 'last_name' => 'Email', 'tracking_code' => 'PF002', 'status' => 'Proposal Sent',
        ]);

        app(LeadDocumentController::class)->sendProposalReadyEmail($lead, false);

        Queue::assertNothingPushed();
    }
}
