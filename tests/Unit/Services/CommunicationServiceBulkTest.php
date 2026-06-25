<?php

namespace Tests\Unit\Services;

use App\Models\Lead;
use App\Models\MessageTemplate;
use App\Models\User;
use App\Services\CommunicationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class CommunicationServiceBulkTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    private function service(): CommunicationService
    {
        return app(CommunicationService::class);
    }

    private function template(): MessageTemplate
    {
        return MessageTemplate::create([
            'key' => 'bulk', 'name' => 'Bulk', 'channels' => ['email'],
            'email_subject' => 'Hi {{first_name}}', 'email_body' => 'Hello {{first_name}}',
        ]);
    }

    private function lead(array $a = []): Lead
    {
        return Lead::create(array_merge(['first_name' => 'Tee', 'last_name' => 'Lead', 'email' => 'tee@example.com'], $a));
    }

    public function test_bulk_send_templated_returns_per_lead_results(): void
    {
        $tpl = $this->template();
        $leads = collect([$this->lead(['email' => 'a@example.com']), $this->lead(['email' => 'b@example.com'])]);

        $results = $this->service()->bulkSendTemplated($leads, $tpl);

        $this->assertCount(2, $results);
        $this->assertSame('sent', $results[0]['status']);
        $this->assertNotNull($results[0]['log_id']);
        $this->assertSame($leads[0]->id, $results[0]['lead_id']);
    }

    public function test_one_failure_does_not_abort_the_batch(): void
    {
        $tpl = $this->template();
        $leads = collect([$this->lead(['email' => 'ok@example.com']), $this->lead(['email' => null])]);

        $results = $this->service()->bulkSendTemplated($leads, $tpl);

        $this->assertSame('sent', $results[0]['status']);
        $this->assertSame('failed', $results[1]['status']); // no email → failed, but batch finished
    }

    public function test_client_portal_url_resolves_for_invited_leads(): void
    {
        config(['app.url' => 'https://crm.example.test']);
        $lead = $this->lead();
        // A portal account (User row with lead_id) marks the lead as invited.
        User::factory()->create(['role' => 'lead', 'lead_id' => $lead->id]);

        $out = $this->service()->render($lead, '{{client_portal_url}}');

        $this->assertSame('https://crm.example.test/portal/lead/dashboard', $out);
    }

    public function test_client_portal_url_falls_back_to_tracker_for_non_invited_leads(): void
    {
        config(['app.url' => 'https://crm.example.test']);
        $lead = $this->lead(); // no portal account

        $out = $this->service()->render($lead, '{{client_portal_url}}');

        $this->assertSame("https://crm.example.test/track/{$lead->tracking_code}", $out);
    }
}
