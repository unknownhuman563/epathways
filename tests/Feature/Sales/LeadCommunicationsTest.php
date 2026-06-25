<?php

namespace Tests\Feature\Sales;

use App\Models\Lead;
use App\Models\MessageLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

    public function test_pagination_works(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $lead = $this->lead();
        foreach (range(1, 60) as $i) {
            $this->logFor($lead, ['subject' => "Msg {$i}"]);
        }

        $res = $this->actingAs($sales)->getJson("/admin/leads/{$lead->id}/communications")->assertOk();

        $this->assertCount(50, $res->json('data'));
        $this->assertNotNull($res->json('next_page_url'));
    }
}
