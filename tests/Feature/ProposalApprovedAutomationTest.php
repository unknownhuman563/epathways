<?php

namespace Tests\Feature;

use App\Mail\TemplatedMessage;
use App\Models\EmailAutomationMessage;
use App\Models\Lead;
use App\Models\MessageTemplate;
use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * "Verify & approve all" in Program Verification fires the Education
 * "Proposal verified & approved" automation. Client / agent / education-team
 * each get their own configured template.
 */
class ProposalApprovedAutomationTest extends TestCase
{
    use RefreshDatabase;

    private function approveAll(User $reviewer, Lead $lead): void
    {
        $this->actingAs($reviewer)
            ->post("/program-verification/{$lead->id}/approve", ['verify_all' => 1, 'send_email' => 1])
            ->assertRedirect();
    }

    public function test_approve_all_ccs_the_clients_agent_when_enabled(): void
    {
        Mail::fake();

        $reviewer = User::factory()->create(['role' => 'super_admin']);
        $agent = User::factory()->create(['role' => 'agent', 'name' => 'Aggie', 'email' => 'aggie@agency.com']);
        $prog = Program::create(['title' => 'Bachelor of X', 'level' => 7, 'category' => 'bachelors', 'status' => 'published']);
        $lead = Lead::create([
            'first_name' => 'Client', 'last_name' => 'One', 'email' => 'client@example.com',
            'agent_id' => $agent->id, 'proposed_program_ids' => [$prog->id],
            'proposal_review' => ['status' => 'pending', 'submitted_at' => now()->toIso8601String()],
        ]);

        MessageTemplate::create([
            'key' => 'proposal_client_notice', 'department' => 'education', 'name' => 'Client notice',
            'channels' => ['email'], 'email_subject' => 'Approved {{first_name}}',
            'email_body' => 'Programmes: {{program_list}}.', 'is_active' => true,
        ]);
        // Client message with "CC the client's agent" turned on.
        EmailAutomationMessage::create([
            'event_key' => 'education.proposal.approved', 'recipient' => 'client',
            'template_key' => 'proposal_client_notice', 'channel' => 'email',
            'enabled' => true, 'cc_agent' => true, 'sort_order' => 0,
        ]);

        $this->approveAll($reviewer, $lead);

        Mail::assertQueued(TemplatedMessage::class, fn ($m) => $m->hasTo('client@example.com')
            && str_contains((string) $m->ccList, 'aggie@agency.com'));
        $this->assertSame('approved', $lead->refresh()->proposal_review['status']);
    }

    public function test_client_automation_replaces_the_builtin_proposal_email(): void
    {
        Mail::fake();

        $reviewer = User::factory()->create(['role' => 'super_admin']);
        $prog = Program::create(['title' => 'Bachelor of Y', 'level' => 7, 'category' => 'bachelors', 'status' => 'published']);
        $lead = Lead::create([
            'first_name' => 'Client', 'last_name' => 'Two', 'email' => 'client@example.com',
            'proposed_program_ids' => [$prog->id],
            'proposal_review' => ['status' => 'pending', 'submitted_at' => now()->toIso8601String()],
        ]);

        MessageTemplate::create([
            'key' => 'proposal_client_notice', 'department' => 'education', 'name' => 'Client notice',
            'channels' => ['email'], 'email_subject' => 'Approved {{first_name}}',
            'email_body' => 'Your programmes are ready.', 'is_active' => true,
        ]);
        EmailAutomationMessage::create([
            'event_key' => 'education.proposal.approved', 'recipient' => 'client',
            'template_key' => 'proposal_client_notice', 'channel' => 'email', 'enabled' => true, 'sort_order' => 0,
        ]);

        $this->approveAll($reviewer, $lead);

        // Exactly one templated email — the automation's client message — and
        // NOT a second built-in "proposal ready" send.
        Mail::assertQueued(TemplatedMessage::class, 1);
        Mail::assertQueued(TemplatedMessage::class, fn ($m) => $m->hasTo('client@example.com') && str_contains($m->subjectLine, 'Approved'));
        $this->assertSame('Proposal Sent', $lead->refresh()->status);
    }
}
