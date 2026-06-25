<?php

namespace Tests\Feature\Communication;

use App\Contracts\SmsProvider;
use App\Models\MessageLog;
use App\Services\Sms\NullSmsProvider;
use App\Services\Sms\TwilioSmsProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SmsIntegrationTest extends TestCase
{
    use RefreshDatabase;

    /** A duck-typed Twilio client whose messages->create() returns a stub. */
    private function fakeTwilioClient(string $sid = 'SM_TEST', string $status = 'queued', bool $throw = false): object
    {
        $message = new class($sid, $status) {
            public function __construct(public string $sid, public string $status) {}
        };

        $messages = new class($message, $throw) {
            public function __construct(private $message, private bool $throw) {}
            public function create($to, $opts)
            {
                if ($this->throw) {
                    throw new \RuntimeException('Twilio API error: invalid number');
                }
                return $this->message;
            }
        };

        return new class($messages) {
            public $messages;
            public function __construct($messages) { $this->messages = $messages; }
        };
    }

    public function test_configured_provider_returns_queued_with_sid(): void
    {
        $provider = new TwilioSmsProvider('AC123', 'token', '+15550000000', $this->fakeTwilioClient('SM_ABC', 'queued'));

        $res = $provider->send('+64211234567', 'Hello');

        $this->assertTrue($res['ok']);
        $this->assertSame('SM_ABC', $res['message_id']);
        $this->assertSame('queued', $res['status']);
    }

    public function test_provider_error_is_caught_and_reported(): void
    {
        $provider = new TwilioSmsProvider('AC123', 'token', '+15550000000', $this->fakeTwilioClient(throw: true));

        $res = $provider->send('+64211234567', 'Hello');

        $this->assertFalse($res['ok']);
        $this->assertStringContainsString('Twilio API error', $res['error']);
    }

    public function test_unconfigured_provider_fails_with_clear_error(): void
    {
        $provider = new TwilioSmsProvider(null, null, null);

        $this->assertFalse($provider->isConfigured());
        $res = $provider->send('+64211234567', 'Hello');
        $this->assertFalse($res['ok']);
        $this->assertStringContainsString('not configured', $res['error']);
    }

    public function test_null_provider_is_used_when_twilio_unset(): void
    {
        config(['services.twilio.sid' => null]);
        $this->app->forgetInstance(SmsProvider::class);

        $this->assertInstanceOf(NullSmsProvider::class, app(SmsProvider::class));
    }

    public function test_test_sms_command_queues_with_fake_provider(): void
    {
        // Bind a provider that accepts the send.
        $this->app->instance(SmsProvider::class, new class implements SmsProvider {
            public function isConfigured(): bool { return true; }
            public function send(string $to, string $body): array
            {
                return ['ok' => true, 'message_id' => 'SM_CMD', 'status' => 'queued', 'error' => null];
            }
        });

        $this->artisan('ep:test-sms', ['phone' => '+64211234567', 'message' => 'Hi'])
            ->assertExitCode(0);

        $this->assertDatabaseHas('message_logs', [
            'channel' => 'sms', 'recipient_type' => 'raw', 'status' => MessageLog::STATUS_QUEUED, 'provider_message_id' => 'SM_CMD',
        ]);
    }

    public function test_test_sms_command_fails_on_unconfigured(): void
    {
        config(['services.twilio.sid' => null]);
        $this->app->forgetInstance(SmsProvider::class);

        $this->artisan('ep:test-sms', ['phone' => '+64211234567', 'message' => 'Hi'])
            ->assertExitCode(1);

        $this->assertDatabaseHas('message_logs', ['channel' => 'sms', 'status' => MessageLog::STATUS_FAILED]);
    }
}
