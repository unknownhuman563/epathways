<?php

namespace Tests\Feature\Communication;

use App\Mail\TemplatedMessage;
use App\Mail\TrackerWelcome;
use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\MessageLog;
use App\Models\User;
use App\Services\LeadIntakeService;
use Database\Seeders\DefaultMessageTemplatesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class MailableMigrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    public function test_tracker_welcome_uses_template_when_seeded(): void
    {
        $this->seed(DefaultMessageTemplatesSeeder::class);

        app(LeadIntakeService::class)->ingest('booking', [
            'first_name' => 'Tess', 'last_name' => 'Lee', 'email' => 'tess@example.com',
        ]);

        Mail::assertQueued(TemplatedMessage::class);
        Mail::assertNotQueued(TrackerWelcome::class); // template path, not legacy
        $this->assertDatabaseHas('message_logs', [
            'template_key' => 'tracker_welcome', 'channel' => 'email', 'recipient_address' => 'tess@example.com',
        ]);
    }

    public function test_falls_back_to_legacy_mailable_when_no_template(): void
    {
        // No templates seeded.
        app(LeadIntakeService::class)->ingest('booking', [
            'first_name' => 'Old', 'last_name' => 'Way', 'email' => 'old@example.com',
        ]);

        Mail::assertQueued(TrackerWelcome::class); // legacy fallback fires
        $this->assertSame(0, MessageLog::count());
    }

    public function test_doc_approved_uses_template_and_substitutes_name(): void
    {
        $this->seed(DefaultMessageTemplatesSeeder::class);
        $admin = User::factory()->create(['role' => 'admin']);
        $lead = Lead::create(['first_name' => 'Dee', 'last_name' => 'Lee', 'email' => 'dee@example.com']);
        $doc = LeadDocument::create([
            'lead_id' => $lead->id, 'original_name' => 'passport.pdf', 'file_path' => 'x/passport.pdf',
            'mime' => 'application/pdf', 'size' => 100, 'status' => LeadDocument::STATUS_SUBMITTED, 'source' => 'upload',
        ]);

        $this->actingAs($admin)->post("/admin/leads/{$lead->id}/documents/{$doc->id}/status", [
            'status' => LeadDocument::STATUS_APPROVED,
        ])->assertRedirect();

        Mail::assertQueued(TemplatedMessage::class);
        $log = MessageLog::where('template_key', 'doc_approved')->where('channel', 'email')->first();
        $this->assertNotNull($log);
        $this->assertStringContainsString('passport.pdf', $log->body);
    }

    public function test_doc_rejected_template_includes_reason(): void
    {
        $this->seed(DefaultMessageTemplatesSeeder::class);
        $admin = User::factory()->create(['role' => 'admin']);
        $lead = Lead::create(['first_name' => 'Rae', 'last_name' => 'Jay', 'email' => 'rae@example.com']);
        $doc = LeadDocument::create([
            'lead_id' => $lead->id, 'original_name' => 'bank.pdf', 'file_path' => 'x/bank.pdf',
            'mime' => 'application/pdf', 'size' => 100, 'status' => LeadDocument::STATUS_SUBMITTED, 'source' => 'upload',
        ]);

        $this->actingAs($admin)->post("/admin/leads/{$lead->id}/documents/{$doc->id}/status", [
            'status' => LeadDocument::STATUS_REJECTED, 'note' => 'Page 2 missing',
        ])->assertRedirect();

        $log = MessageLog::where('template_key', 'doc_rejected')->where('channel', 'email')->first();
        $this->assertNotNull($log);
        $this->assertStringContainsString('Page 2 missing', $log->body);
    }
}
