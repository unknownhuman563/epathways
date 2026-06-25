<?php

namespace Tests\Feature\Track;

use App\Models\ActivityLog;
use App\Models\Lead;
use App\Models\User;
use App\Notifications\LeadInfoUpdated;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class TrackerInfoUpdateTest extends TestCase
{
    use RefreshDatabase;

    private function lead(array $attrs = []): Lead
    {
        return Lead::create(array_merge([
            'first_name' => 'Track', 'last_name' => 'Lead',
            'email' => 'old@example.com', 'phone' => '+64 21 000 0000',
        ], $attrs));
    }

    private function update(Lead $lead, array $data)
    {
        return $this->post("/track/{$lead->tracking_code}/info", $data);
    }

    public function test_lead_can_update_basic_fields(): void
    {
        $lead = $this->lead();

        $this->update($lead, [
            'first_name' => 'Renamed',
            'last_name'  => 'Person',
            'phone'      => '+64 27 111 2222',
            'email'      => 'new@example.com',
        ])->assertRedirect();

        $lead->refresh();
        $this->assertSame('Renamed', $lead->first_name);
        $this->assertSame('new@example.com', $lead->email);
        $this->assertSame('+64 27 111 2222', $lead->phone);
    }

    public function test_encrypted_passport_updates_and_is_encrypted_at_rest(): void
    {
        $lead = $this->lead();

        $this->update($lead, ['passport_number' => 'P1234567'])->assertRedirect();

        $this->assertSame('P1234567', $lead->fresh()->passport_number); // decrypts via cast
        $raw = \DB::table('leads')->where('id', $lead->id)->value('passport_number');
        $this->assertNotSame('P1234567', $raw); // ciphertext at rest
    }

    public function test_invalid_input_is_rejected(): void
    {
        $lead = $this->lead();

        $this->update($lead, ['email' => 'not-an-email'])->assertSessionHasErrors('email');
        $this->assertSame('old@example.com', $lead->fresh()->email);
    }

    public function test_update_creates_audit_log_with_tracking_code_actor(): void
    {
        $lead = $this->lead();

        $this->update($lead, ['first_name' => 'Logged']);

        $log = ActivityLog::where('action', 'lead.updated')->where('entity_id', $lead->id)->latest()->first();
        $this->assertNotNull($log);
        $this->assertSame($lead->tracking_code, $log->actor_name);
        $this->assertSame('tracker', $log->actor_role);
    }

    public function test_audit_log_redacts_passport_value(): void
    {
        $lead = $this->lead();

        $this->update($lead, ['passport_number' => 'SECRET-PASSPORT-99']);

        $log = ActivityLog::where('action', 'lead.updated')->where('entity_id', $lead->id)->latest()->first();
        $serialized = json_encode($log->properties);
        $this->assertStringNotContainsString('SECRET-PASSPORT-99', $serialized);
        $this->assertStringContainsString('[updated]', $serialized);
    }

    public function test_staff_notified_on_key_field_changes(): void
    {
        Notification::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $lead = $this->lead();

        $this->update($lead, ['phone' => '+64 27 999 9999', 'first_name' => 'NameOnly']);

        Notification::assertSentTo($admin, LeadInfoUpdated::class, fn ($n) => in_array('phone', $n->fields));
    }

    public function test_no_notification_when_only_non_key_fields_change(): void
    {
        Notification::fake();
        User::factory()->create(['role' => 'admin']);
        $lead = $this->lead();

        $this->update($lead, ['middle_name' => 'Middle']); // not a key field

        Notification::assertNothingSent();
    }

    public function test_concurrent_edits_last_write_wins_both_logged(): void
    {
        $lead = $this->lead();

        $this->update($lead, ['first_name' => 'First']);
        $this->update($lead, ['first_name' => 'Second']);

        $this->assertSame('Second', $lead->fresh()->first_name);
        $this->assertGreaterThanOrEqual(2, ActivityLog::where('action', 'lead.updated')->where('entity_id', $lead->id)->count());
    }
}
