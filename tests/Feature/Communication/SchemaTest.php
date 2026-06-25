<?php

namespace Tests\Feature\Communication;

use App\Models\MessageLog;
use App\Models\MessageTemplate;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchemaTest extends TestCase
{
    use RefreshDatabase;

    private function template(array $attrs = []): MessageTemplate
    {
        return MessageTemplate::create(array_merge([
            'key'          => 'tracker_welcome',
            'name'         => 'Tracker Welcome',
            'channels'     => ['email'],
            'email_subject' => 'Track your application',
            'email_body'   => 'Hi {{first_name}}',
        ], $attrs));
    }

    public function test_template_can_be_created(): void
    {
        $t = $this->template();
        $this->assertDatabaseHas('message_templates', ['key' => 'tracker_welcome']);
        $this->assertSame(['email'], $t->channels);
        $this->assertTrue($t->fresh()->is_active); // DB default applies on insert
    }

    public function test_template_key_is_unique(): void
    {
        $this->template();
        $this->expectException(QueryException::class);
        $this->template(); // same key
    }

    public function test_message_log_records_sent_and_failed(): void
    {
        $sent = MessageLog::create([
            'channel' => 'email', 'recipient_type' => 'lead', 'recipient_address' => 'a@b.co',
            'status' => MessageLog::STATUS_SENT, 'sent_at' => now(),
        ]);
        $failed = MessageLog::create([
            'channel' => 'sms', 'recipient_type' => 'lead', 'recipient_address' => '+64211111111',
            'status' => MessageLog::STATUS_FAILED, 'error_message' => 'boom', 'failed_at' => now(),
        ]);

        $this->assertSame('sent', $sent->status);
        $this->assertSame('failed', $failed->status);
        $this->assertSame('boom', $failed->error_message);
    }

    public function test_soft_delete_works(): void
    {
        $t = $this->template();
        $t->delete();

        $this->assertSoftDeleted('message_templates', ['id' => $t->id]);
        $this->assertNull(MessageTemplate::find($t->id));
        $this->assertNotNull(MessageTemplate::withTrashed()->find($t->id));
    }

    public function test_active_scope_excludes_inactive(): void
    {
        $this->template(['key' => 'active_one', 'is_active' => true]);
        $this->template(['key' => 'inactive_one', 'is_active' => false]);

        $keys = MessageTemplate::active()->pluck('key')->all();
        $this->assertContains('active_one', $keys);
        $this->assertNotContains('inactive_one', $keys);
    }
}
