<?php

namespace Tests\Feature\Communication;

use App\Contracts\SmsProvider;
use App\Mail\TemplatedMessage;
use App\Models\Lead;
use App\Models\MessageLog;
use App\Models\MessageTemplate;
use App\Services\CommunicationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class CommunicationServiceTest extends TestCase
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

    /** Bind an SMS provider that always succeeds (Twilio-accepted). */
    private function fakeSmsOk(): void
    {
        $this->app->instance(SmsProvider::class, new class implements SmsProvider {
            public function isConfigured(): bool { return true; }
            public function send(string $to, string $body): array
            {
                return ['ok' => true, 'message_id' => 'SM_FAKE_123', 'status' => 'queued', 'error' => null];
            }
        });
    }

    private function lead(array $attrs = []): Lead
    {
        return Lead::create(array_merge([
            'first_name' => 'Mara', 'last_name' => 'Cruz',
            'email' => 'mara@example.com', 'phone' => '021 555 0100',
        ], $attrs));
    }

    private function template(array $attrs = []): MessageTemplate
    {
        return MessageTemplate::create(array_merge([
            'key' => 'tmpl', 'name' => 'Tmpl', 'channels' => ['email', 'sms'],
            'email_subject' => 'Hi {{first_name}}', 'email_body' => 'Hello {{first_name}}, see {{tracker_url}}',
            'sms_body' => 'Hi {{first_name}}',
        ], $attrs));
    }

    public function test_send_templated_dispatches_email(): void
    {
        $this->template(['channels' => ['email']]);
        $res = $this->service()->sendTemplated('tmpl', $this->lead());

        Mail::assertQueued(TemplatedMessage::class);
        $this->assertNotNull($res['email']);
        $this->assertSame(MessageLog::STATUS_QUEUED, $res['email']->status);
    }

    public function test_send_templated_dispatches_sms_for_valid_phone(): void
    {
        $this->fakeSmsOk();
        $this->template(['channels' => ['sms']]);

        $res = $this->service()->sendTemplated('tmpl', $this->lead());

        $this->assertNotNull($res['sms']);
        $this->assertSame(MessageLog::STATUS_QUEUED, $res['sms']->status);
        $this->assertSame('SM_FAKE_123', $res['sms']->provider_message_id);
        $this->assertStringStartsWith('+64', $res['sms']->recipient_address); // normalized to E.164
    }

    public function test_ph_phone_normalization(): void
    {
        $this->fakeSmsOk();
        $this->template(['channels' => ['sms']]);

        // 1. PH mobile number starting with 09
        $res1 = $this->service()->sendTemplated('tmpl', $this->lead(['phone' => '09206922477']));
        $this->assertNotNull($res1['sms']);
        $this->assertSame('+639206922477', $res1['sms']->recipient_address);

        // 2. PH mobile number starting with 9 (no leading 0)
        $res2 = $this->service()->sendTemplated('tmpl', $this->lead(['phone' => '9206922477']));
        $this->assertNotNull($res2['sms']);
        $this->assertSame('+639206922477', $res2['sms']->recipient_address);

        // 3. PH mobile number pre-formatted with +63
        $res3 = $this->service()->sendTemplated('tmpl', $this->lead(['phone' => '+639206922477']));
        $this->assertNotNull($res3['sms']);
        $this->assertSame('+639206922477', $res3['sms']->recipient_address);
    }

    public function test_logs_a_message_log_per_channel(): void
    {
        $this->fakeSmsOk();
        $this->template();
        $this->service()->sendTemplated('tmpl', $this->lead());

        $this->assertSame(1, MessageLog::where('channel', 'email')->count());
        $this->assertSame(1, MessageLog::where('channel', 'sms')->count());
    }

    public function test_variable_substitution_replaces_first_name(): void
    {
        $this->template(['channels' => ['email']]);
        $res = $this->service()->sendTemplated('tmpl', $this->lead(['first_name' => 'Zaniyah']));

        $this->assertStringContainsString('Hello Zaniyah', $res['email']->body);
        $this->assertSame('Hi Zaniyah', $res['email']->subject);
    }

    public function test_resolves_linked_event_variables(): void
    {
        $event = \App\Models\Event::create([
            'name' => 'NZ Dream Workshop',
            'event_code' => 'nz-dream',
            'type' => 'Workshop',
            'date_from' => '2026-07-10',
            'time_start' => '14:00:00',
            'mode' => 'online',
        ]);

        $lead = $this->lead(['event_id' => $event->id]);
        $this->template([
            'channels' => ['email'],
            'email_body' => 'Event: {{event_name}}, Date: {{event_date}}, Location: {{event_location}}'
        ]);

        $res = $this->service()->sendTemplated('tmpl', $lead);

        $this->assertStringContainsString('Event: NZ Dream Workshop', $res['email']->body);
        $this->assertStringContainsString('Date: Friday, 10 July 2026', $res['email']->body);
        $this->assertStringContainsString('Location: Online', $res['email']->body);
    }

    public function test_unknown_variables_left_empty(): void
    {
        $this->template(['channels' => ['email'], 'email_body' => 'A {{does_not_exist}} B']);
        $res = $this->service()->sendTemplated('tmpl', $this->lead());

        $this->assertSame('A  B', $res['email']->body); // token removed, no crash
    }

    public function test_invalid_phone_logs_failed_sms(): void
    {
        $this->fakeSmsOk();
        $this->template(['channels' => ['sms']]);

        $res = $this->service()->sendTemplated('tmpl', $this->lead(['phone' => 'not-a-phone']));

        $this->assertSame(MessageLog::STATUS_FAILED, $res['sms']->status);
        $this->assertStringContainsString('Invalid phone', $res['sms']->error_message);
    }

    public function test_lead_without_email_skips_email(): void
    {
        $this->template(['channels' => ['email']]);
        $res = $this->service()->sendTemplated('tmpl', $this->lead(['email' => null]));

        $this->assertNull($res['email']);
        Mail::assertNothingQueued();
    }

    public function test_empty_channels_sends_nothing(): void
    {
        $this->template(['channels' => []]);
        $res = $this->service()->sendTemplated('tmpl', $this->lead());

        $this->assertNull($res['email']);
        $this->assertNull($res['sms']);
        $this->assertSame(0, MessageLog::count());
    }

    public function test_tracker_url_uses_app_url(): void
    {
        config(['app.url' => 'https://comms.example.test']);
        $this->template(['channels' => ['email']]);
        $lead = $this->lead();

        $res = $this->service()->sendTemplated('tmpl', $lead);

        $this->assertStringContainsString("https://comms.example.test/track/{$lead->tracking_code}", $res['email']->body);
    }

    public function test_send_raw_works_without_template(): void
    {
        $log = $this->service()->sendRaw('email', $this->lead(), 'Subject', 'Body text');

        $this->assertSame(MessageLog::STATUS_QUEUED, $log->status);
        $this->assertNull($log->template_key);
        Mail::assertQueued(TemplatedMessage::class);
    }
}
