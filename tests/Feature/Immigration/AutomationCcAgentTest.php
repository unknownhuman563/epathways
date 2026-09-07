<?php

namespace Tests\Feature\Immigration;

use App\Mail\TemplatedMessage;
use App\Models\EmailAutomationMessage;
use App\Models\Lead;
use App\Models\MessageTemplate;
use App\Models\User;
use App\Services\EmailAutomationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * When a message has "CC the client's agent" enabled, the automation resolves
 * the lead's OWN recruiting agent (leads.agent_id) and CCs them — per-lead, so
 * each client's agent is used. Off by default, and never CCs when the lead has
 * no agent.
 */
class AutomationCcAgentTest extends TestCase
{
    use RefreshDatabase;

    private function clientTemplate(): void
    {
        MessageTemplate::create([
            'key' => 'test_client_update',
            'department' => 'education',
            'name' => 'Client update',
            'channels' => ['email'],
            'email_subject' => 'Update for {{first_name}}',
            'email_body' => 'There is an update on your application.',
            'is_active' => true,
        ]);
    }

    public function test_client_message_ccs_the_leads_own_agent_when_enabled(): void
    {
        Mail::fake();
        $this->clientTemplate();

        $agent = User::factory()->create(['name' => 'Aggie Agent', 'email' => 'aggie@agency.com', 'role' => 'agent']);
        $lead = Lead::create([
            'first_name' => 'Client', 'last_name' => 'One', 'email' => 'client@example.com',
            'agent_id' => $agent->id,
        ]);

        EmailAutomationMessage::create([
            'event_key' => 'education.proposal.submitted',
            'recipient' => 'client',
            'template_key' => 'test_client_update',
            'channel' => 'email',
            'enabled' => true,
            'cc_agent' => true,
            'sort_order' => 0,
        ]);

        app(EmailAutomationService::class)->fire('education.proposal.submitted', $lead, []);

        Mail::assertQueued(TemplatedMessage::class, function (TemplatedMessage $mail) {
            return $mail->hasTo('client@example.com')
                && str_contains((string) $mail->ccList, 'aggie@agency.com');
        });
    }

    public function test_agent_is_not_cced_when_toggle_is_off(): void
    {
        Mail::fake();
        $this->clientTemplate();

        $agent = User::factory()->create(['name' => 'Aggie Agent', 'email' => 'aggie@agency.com', 'role' => 'agent']);
        $lead = Lead::create([
            'first_name' => 'Client', 'last_name' => 'Two', 'email' => 'client@example.com',
            'agent_id' => $agent->id,
        ]);

        EmailAutomationMessage::create([
            'event_key' => 'education.proposal.submitted',
            'recipient' => 'client',
            'template_key' => 'test_client_update',
            'channel' => 'email',
            'enabled' => true,
            'cc_agent' => false,
            'sort_order' => 0,
        ]);

        app(EmailAutomationService::class)->fire('education.proposal.submitted', $lead, []);

        Mail::assertQueued(TemplatedMessage::class, function (TemplatedMessage $mail) {
            return $mail->hasTo('client@example.com')
                && ! str_contains((string) $mail->ccList, 'aggie@agency.com');
        });
    }
}
