<?php

namespace Tests\Feature\Sales;

use App\Models\EmailReply;
use App\Models\Lead;
use App\Models\MessageLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class LeadCommunicationsTest extends TestCase
{
    use RefreshDatabase;

    private function lead(array $a = []): Lead
    {
        return Lead::create(array_merge(['first_name' => 'Co', 'last_name' => 'Lead', 'email' => 'co@example.com'], $a));
    }

    private function logFor(Lead $lead, array $a = []): MessageLog
    {
        return MessageLog::create(array_merge([
            'channel' => 'email', 'recipient_type' => 'lead', 'recipient_id' => $lead->id,
            'recipient_address' => $lead->email, 'subject' => 'Hi', 'body' => 'Body', 'status' => 'queued',
        ], $a));
    }

    public function test_staff_can_see_communications_for_accessible_lead(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $lead = $this->lead();
        $this->logFor($lead, ['subject' => 'Welcome']);

        $this->actingAs($sales)
            ->getJson("/admin/leads/{$lead->id}/communications")
            ->assertOk()
            ->assertJsonPath('data.0.subject', 'Welcome');
    }

    public function test_staff_cannot_see_communications_for_inaccessible_lead(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $case = $this->lead(['is_immigration_case' => true]);
        $this->logFor($case);

        $this->actingAs($sales)->getJson("/admin/leads/{$case->id}/communications")->assertForbidden();
    }

    public function test_feed_returns_the_thread_without_pagination(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $lead = $this->lead();
        foreach (range(1, 60) as $i) {
            $this->logFor($lead, ['subject' => "Msg {$i}"]);
        }

        $res = $this->actingAs($sales)->getJson("/admin/leads/{$lead->id}/communications")->assertOk();

        $this->assertCount(60, $res->json('data'));
        $this->assertNull($res->json('next_page_url'));
        $this->assertTrue($res->json('can_email'));
    }

    public function test_inbound_replies_are_merged_into_the_feed(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $lead = $this->lead();
        $this->logFor($lead, ['subject' => 'Our email']);
        EmailReply::create([
            'lead_id' => $lead->id, 'direction' => 'inbound',
            'from_email' => $lead->email, 'from_name' => 'Co Lead', 'to_email' => 'hello@epathways.ph',
            'subject' => 'Their reply', 'body_text' => 'Thanks!', 'received_at' => now(), 'is_read' => false,
        ]);

        $res = $this->actingAs($sales)->getJson("/admin/leads/{$lead->id}/communications")->assertOk();

        $data = collect($res->json('data'));
        $this->assertTrue($data->contains(fn ($m) => $m['direction'] === 'in' && $m['subject'] === 'Their reply'));
        $this->assertTrue($data->contains(fn ($m) => $m['direction'] === 'out' && $m['subject'] === 'Our email'));
    }

    public function test_can_email_is_false_when_lead_has_no_email(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $lead = $this->lead(['email' => null]);

        $this->actingAs($sales)->getJson("/admin/leads/{$lead->id}/communications")
            ->assertOk()->assertJsonPath('can_email', false);
    }

    public function test_staff_can_reply_and_it_is_logged(): void
    {
        Mail::fake();
        $sales = User::factory()->create(['role' => 'sales']);
        $lead = $this->lead();

        $this->actingAs($sales)
            ->postJson("/admin/leads/{$lead->id}/communications", ['subject' => 'Re: hi', 'body' => '<p>Hello there</p>'])
            ->assertOk()->assertJsonPath('ok', true);

        $this->assertDatabaseHas('message_logs', [
            'recipient_type' => 'lead', 'recipient_id' => $lead->id, 'channel' => 'email', 'subject' => 'Re: hi',
        ]);
    }

    public function test_reply_is_blocked_when_lead_has_no_email(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $lead = $this->lead(['email' => null]);

        $this->actingAs($sales)
            ->postJson("/admin/leads/{$lead->id}/communications", ['body' => 'Hello'])
            ->assertStatus(422);

        $this->assertDatabaseCount('message_logs', 0);
    }

    public function test_reply_to_inaccessible_lead_is_forbidden(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $case = $this->lead(['is_immigration_case' => true]);

        $this->actingAs($sales)
            ->postJson("/admin/leads/{$case->id}/communications", ['body' => 'Hello'])
            ->assertForbidden();
    }
}
