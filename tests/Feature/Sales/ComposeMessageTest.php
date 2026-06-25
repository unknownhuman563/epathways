<?php

namespace Tests\Feature\Sales;

use App\Contracts\SmsProvider;
use App\Models\Lead;
use App\Models\MessageLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ComposeMessageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    private function fakeSmsOk(): void
    {
        $this->app->instance(SmsProvider::class, new class implements SmsProvider {
            public function isConfigured(): bool { return true; }
            public function send(string $to, string $body): array
            {
                return ['ok' => true, 'message_id' => 'SM_1', 'status' => 'queued', 'error' => null];
            }
        });
    }

    private function lead(array $a = []): Lead
    {
        return Lead::create(array_merge([
            'first_name' => 'Cy', 'last_name' => 'Lead', 'email' => 'cy@example.com', 'phone' => '021 555 0100',
        ], $a));
    }

    public function test_staff_can_compose_to_an_accessible_lead(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $lead = $this->lead();

        $this->actingAs($sales)
            ->postJson("/admin/leads/{$lead->id}/compose", ['channel' => 'email', 'subject' => 'Hi', 'body' => 'Hello {{first_name}}'])
            ->assertOk()->assertJsonPath('count', 1);
    }

    public function test_staff_cannot_compose_to_a_lead_outside_their_department(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $case = $this->lead(['is_immigration_case' => true]);

        $this->actingAs($sales)
            ->postJson("/admin/leads/{$case->id}/compose", ['channel' => 'email', 'subject' => 'Hi', 'body' => 'x'])
            ->assertForbidden();
    }

    public function test_email_only_creates_one_email_log(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $lead = $this->lead();

        $this->actingAs($sales)->postJson("/admin/leads/{$lead->id}/compose", ['channel' => 'email', 'subject' => 'S', 'body' => 'B']);

        $this->assertSame(1, MessageLog::where('channel', 'email')->count());
        $this->assertSame(0, MessageLog::where('channel', 'sms')->count());
    }

    public function test_sms_only_creates_one_sms_log(): void
    {
        $this->fakeSmsOk();
        $sales = User::factory()->create(['role' => 'sales']);
        $lead = $this->lead();

        $this->actingAs($sales)->postJson("/admin/leads/{$lead->id}/compose", ['channel' => 'sms', 'body' => 'Txt'])->assertOk();

        $this->assertSame(0, MessageLog::where('channel', 'email')->count());
        $this->assertSame(1, MessageLog::where('channel', 'sms')->count());
    }

    public function test_both_creates_two_log_entries(): void
    {
        $this->fakeSmsOk();
        $sales = User::factory()->create(['role' => 'sales']);
        $lead = $this->lead();

        $this->actingAs($sales)
            ->postJson("/admin/leads/{$lead->id}/compose", ['channel' => 'both', 'subject' => 'S', 'body' => 'B'])
            ->assertOk()->assertJsonPath('count', 2);

        $this->assertSame(2, MessageLog::count());
    }
}
