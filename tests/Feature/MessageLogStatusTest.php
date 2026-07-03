<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\MessageLog;
use App\Services\CommunicationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessageLogStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_log_flips_from_queued_to_sent_on_delivery(): void
    {
        // 'array' transport still fires MessageSent (so the listener runs);
        // 'sync' queue delivers immediately during the send call.
        config(['mail.default' => 'array', 'queue.default' => 'sync']);

        $lead = Lead::create([
            'lead_id' => 'LP-STATUS', 'first_name' => 'Test', 'last_name' => 'User',
            'email' => 'status@example.com',
        ]);

        $log = app(CommunicationService::class)->sendRaw('email', $lead, 'Subject', '<p>Body</p>');

        $log->refresh();
        $this->assertEquals(MessageLog::STATUS_SENT, $log->status);
        $this->assertNotNull($log->sent_at);
    }
}
