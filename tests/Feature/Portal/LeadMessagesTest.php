<?php

namespace Tests\Feature\Portal;

use App\Models\Lead;
use App\Models\MessageLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LeadMessagesTest extends TestCase
{
    use RefreshDatabase;

    /** A lead-role user linked to its own Lead record. */
    private function leadUser(): array
    {
        $lead = Lead::create(['first_name' => 'My', 'last_name' => 'Lead', 'email' => 'my@example.com']);
        $user = User::factory()->create(['role' => 'lead', 'lead_id' => $lead->id]);

        return [$user, $lead];
    }

    private function emailLog(Lead $lead, array $a = []): MessageLog
    {
        return MessageLog::create(array_merge([
            'channel' => 'email', 'recipient_type' => 'lead', 'recipient_id' => $lead->id,
            'recipient_address' => $lead->email, 'subject' => 'Hi', 'body' => 'Body', 'status' => 'queued',
        ], $a));
    }

    public function test_lead_can_see_their_own_messages(): void
    {
        [$user, $lead] = $this->leadUser();
        $this->emailLog($lead, ['subject' => 'Your update']);

        $this->actingAs($user)
            ->get('/portal/lead/messages')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->component('portal/lead/Messages')
                ->has('messages.data', 1)
                ->where('messages.data.0.subject', 'Your update'));
    }

    public function test_lead_cannot_see_another_leads_messages(): void
    {
        [$user, $lead] = $this->leadUser();
        $this->emailLog($lead, ['subject' => 'Mine']);

        // Another lead with their own message — must never appear.
        $other = Lead::create(['first_name' => 'Other', 'last_name' => 'Lead', 'email' => 'other@example.com']);
        $this->emailLog($other, ['subject' => 'SECRET — not mine']);

        $this->actingAs($user)
            ->get('/portal/lead/messages')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->has('messages.data', 1) // only my one message
                ->where('messages.data.0.subject', 'Mine'));
    }

    public function test_empty_state_when_no_messages(): void
    {
        [$user] = $this->leadUser();

        $this->actingAs($user)
            ->get('/portal/lead/messages')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('portal/lead/Messages')->has('messages.data', 0));
    }

    public function test_pagination_works(): void
    {
        [$user, $lead] = $this->leadUser();
        foreach (range(1, 25) as $i) {
            $this->emailLog($lead, ['subject' => "Msg {$i}"]);
        }

        $this->actingAs($user)
            ->get('/portal/lead/messages')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->has('messages.data', 20)); // page size 20
    }
}
