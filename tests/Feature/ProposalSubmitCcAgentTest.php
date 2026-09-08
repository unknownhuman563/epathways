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
 * End-to-end: submitting a study proposal for verification fires the Education
 * "Proposal submitted for verification" automation, and when its message has
 * "CC the client's agent" enabled, the lead's OWN agent is CC'd on the email.
 */
class ProposalSubmitCcAgentTest extends TestCase
{
    use RefreshDatabase;

    private function scenario(bool $ccAgent): array
    {
        $staff = User::factory()->create(['role' => 'super_admin']);
        $agent = User::factory()->create(['role' => 'agent', 'name' => 'Aggie Agent', 'email' => 'aggie@agency.com']);
        $prog = Program::create(['title' => 'Bachelor of X', 'level' => 7, 'category' => 'bachelors', 'status' => 'published']);
        $lead = Lead::create([
            'first_name' => 'Client', 'last_name' => 'One', 'email' => 'client@example.com',
            'agent_id' => $agent->id,
        ]);

        MessageTemplate::create([
            'key' => 'program_proposal',
            'department' => 'education',
            'name' => 'Proposal submitted',
            'channels' => ['email'],
            'email_subject' => 'Your proposal, {{first_name}}',
            'email_body' => 'We have submitted {{program_count}} programme(s): {{program_list}}.',
            'is_active' => true,
        ]);

        EmailAutomationMessage::create([
            'event_key' => 'education.proposal.submitted',
            'recipient' => 'client',
            'template_key' => 'program_proposal',
            'channel' => 'email',
            'enabled' => true,
            'cc_agent' => $ccAgent,
            'sort_order' => 0,
        ]);

        return [$staff, $lead, $prog];
    }

    public function test_submitting_a_proposal_ccs_the_leads_agent_when_enabled(): void
    {
        Mail::fake();
        [$staff, $lead, $prog] = $this->scenario(ccAgent: true);

        $this->actingAs($staff)
            ->post("/admin/leads/{$lead->id}/proposal", ['program_ids' => [$prog->id]])
            ->assertRedirect();

        Mail::assertQueued(TemplatedMessage::class, function (TemplatedMessage $mail) {
            return $mail->hasTo('client@example.com')
                && str_contains((string) $mail->ccList, 'aggie@agency.com');
        });
    }

    public function test_submitting_a_proposal_does_not_cc_the_agent_when_disabled(): void
    {
        Mail::fake();
        [$staff, $lead, $prog] = $this->scenario(ccAgent: false);

        $this->actingAs($staff)
            ->post("/admin/leads/{$lead->id}/proposal", ['program_ids' => [$prog->id]])
            ->assertRedirect();

        Mail::assertQueued(TemplatedMessage::class, function (TemplatedMessage $mail) {
            return $mail->hasTo('client@example.com')
                && ! str_contains((string) $mail->ccList, 'aggie@agency.com');
        });
    }
}
