<?php

namespace Tests\Feature\Sales;

use App\Models\Lead;
use App\Models\MessageLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class BulkEmailTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    private function pipelineLead(array $a = []): Lead
    {
        return Lead::create(array_merge(['first_name' => 'Pi', 'last_name' => 'Lead', 'email' => 'pi@example.com'], $a));
    }

    private function payload(array $ids, array $extra = []): array
    {
        return array_merge(['lead_ids' => $ids, 'subject' => 'Hi {{first_name}}', 'body' => 'Hello {{first_name}}'], $extra);
    }

    public function test_sales_can_preview_own_department_leads(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $l1 = $this->pipelineLead(['first_name' => 'Ana']);
        $l2 = $this->pipelineLead(['first_name' => 'Bo', 'email' => 'bo@example.com']);

        $this->actingAs($sales)
            ->postJson('/portal/sales/leads/bulk-email/preview', $this->payload([$l1->id, $l2->id]))
            ->assertOk()
            ->assertJsonPath('total_count', 2)
            ->assertJsonPath('previews.0.rendered_subject', 'Hi Ana');
    }

    public function test_sales_cannot_preview_immigration_leads(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $case = $this->pipelineLead(['is_immigration_case' => true]);

        $this->actingAs($sales)
            ->postJson('/portal/sales/leads/bulk-email/preview', $this->payload([$case->id]))
            ->assertForbidden();
    }

    public function test_admin_can_preview_any_leads(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $case = $this->pipelineLead(['is_immigration_case' => true]);

        $this->actingAs($admin)
            ->postJson('/portal/sales/leads/bulk-email/preview', $this->payload([$case->id]))
            ->assertOk()->assertJsonPath('total_count', 1);
    }

    public function test_bulk_send_sends_to_all_listed_leads(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $ids = collect(range(1, 3))->map(fn ($i) => $this->pipelineLead(['email' => "lead{$i}@example.com"])->id)->all();

        $this->actingAs($sales)
            ->postJson('/portal/sales/leads/bulk-email/send', $this->payload($ids))
            ->assertOk()->assertJsonPath('sent', 3)->assertJsonPath('failed', 0);

        $this->assertSame(3, MessageLog::where('channel', 'email')->count());
    }

    public function test_per_lead_failure_does_not_abort_the_batch(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $ok   = $this->pipelineLead(['email' => 'ok@example.com']);
        $bad  = $this->pipelineLead(['email' => null]); // no email → fails, batch continues

        $res = $this->actingAs($sales)
            ->postJson('/portal/sales/leads/bulk-email/send', $this->payload([$ok->id, $bad->id]))
            ->assertOk();

        $res->assertJsonPath('sent', 1)->assertJsonPath('failed', 1);
    }

    public function test_validation_rejects_invalid_lead_ids(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);

        $this->actingAs($sales)
            ->postJson('/portal/sales/leads/bulk-email/send', $this->payload([999999]))
            ->assertStatus(422)->assertJsonValidationErrors('lead_ids.0');
    }

    public function test_validation_rejects_body_over_50k(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $lead = $this->pipelineLead();

        $this->actingAs($sales)
            ->postJson('/portal/sales/leads/bulk-email/send', $this->payload([$lead->id], ['body' => str_repeat('x', 50001)]))
            ->assertStatus(422)->assertJsonValidationErrors('body');
    }

    public function test_message_logs_created_for_each_send(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $a = $this->pipelineLead(['email' => 'a@example.com']);
        $b = $this->pipelineLead(['email' => 'b@example.com']);

        $this->actingAs($sales)->postJson('/portal/sales/leads/bulk-email/send', $this->payload([$a->id, $b->id]));

        $this->assertSame(1, MessageLog::where('recipient_id', $a->id)->count());
        $this->assertSame(1, MessageLog::where('recipient_id', $b->id)->count());
    }
}
