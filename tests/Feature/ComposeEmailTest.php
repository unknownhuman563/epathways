<?php

namespace Tests\Feature;

use App\Mail\TemplatedMessage;
use App\Models\Lead;
use App\Models\MessageLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ComposeEmailTest extends TestCase
{
    use RefreshDatabase;

    public function test_compose_sends_to_a_lead_and_a_typed_address_and_logs_each(): void
    {
        Mail::fake();

        $admin = User::factory()->create(['role' => 'admin']);
        $lead = Lead::create(['first_name' => 'Angi', 'last_name' => 'L', 'email' => 'angi@example.com']);

        $this->actingAs($admin)->post('/admin/email/compose/send', [
            'lead_ids' => [$lead->id],
            'emails' => ['someone@external.com'],
            'subject' => 'Hi {{first_name}}',
            'body' => '<p>Hello {{first_name}}</p>',
        ])->assertRedirect();

        // One log per recipient, tagged source=compose.
        $this->assertSame(2, MessageLog::where('source', 'compose')->count());
        $this->assertSame(1, MessageLog::where('source', 'compose')->where('recipient_type', 'lead')->where('recipient_id', $lead->id)->count());
        $this->assertSame(1, MessageLog::where('source', 'compose')->where('recipient_type', 'raw')->where('recipient_address', 'someone@external.com')->count());

        Mail::assertQueued(TemplatedMessage::class, fn (TemplatedMessage $m) => $m->hasTo('angi@example.com') && str_contains($m->markdownBody, 'Angi'));
        Mail::assertQueued(TemplatedMessage::class, fn (TemplatedMessage $m) => $m->hasTo('someone@external.com') && ! str_contains($m->markdownBody, '{{first_name}}'));
    }

    public function test_compose_requires_at_least_one_recipient(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->post('/admin/email/compose/send', [
            'subject' => 'Hi', 'body' => '<p>x</p>',
        ])->assertSessionHasErrors('error');
    }
}
