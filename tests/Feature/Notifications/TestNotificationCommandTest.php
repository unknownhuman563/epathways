<?php

namespace Tests\Feature\Notifications;

use App\Models\User;
use App\Notifications\DocumentSubmittedForReview;
use App\Notifications\LeadAssignedToYou;
use App\Notifications\VisaTypePriceChanged;
use App\Support\NotificationFormatter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class TestNotificationCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_fires_assignment_type(): void
    {
        Notification::fake();
        $user = User::factory()->create(['role' => 'sales', 'email' => 'jane@example.com']);

        $this->artisan('ep:test-notification', ['email' => 'jane@example.com', 'type' => 'assignment'])
            ->assertExitCode(0);

        Notification::assertSentTo($user, LeadAssignedToYou::class);
    }

    public function test_command_fires_document_type(): void
    {
        Notification::fake();
        $user = User::factory()->create(['role' => 'sales', 'email' => 'doc@example.com']);

        $this->artisan('ep:test-notification', ['email' => 'doc@example.com', 'type' => 'document'])
            ->assertExitCode(0);

        Notification::assertSentTo($user, DocumentSubmittedForReview::class);
    }

    public function test_command_fires_price_change_type(): void
    {
        Notification::fake();
        $user = User::factory()->create(['role' => 'immigration', 'email' => 'imm@example.com']);

        $this->artisan('ep:test-notification', ['email' => 'imm@example.com', 'type' => 'price-change'])
            ->assertExitCode(0);

        Notification::assertSentTo($user, VisaTypePriceChanged::class);
    }

    public function test_command_fails_on_unknown_user(): void
    {
        $this->artisan('ep:test-notification', ['email' => 'nobody@example.com', 'type' => 'assignment'])
            ->assertExitCode(1);
    }

    public function test_visa_price_changed_is_stored_and_formatted(): void
    {
        // End-to-end: real notify() writes a row, and the formatter maps it
        // to the DollarSign/amber visa-pricing presentation.
        $user = User::factory()->create(['role' => 'immigration', 'email' => 'price@example.com']);

        $this->artisan('ep:test-notification', ['email' => 'price@example.com', 'type' => 'price-change'])
            ->assertExitCode(0);

        $row = $user->notifications()->first();
        $this->assertNotNull($row);

        $formatted = NotificationFormatter::format(['type' => $row->type, 'data' => $row->data]);
        $this->assertSame('VisaTypePriceChanged', $formatted['type']);
        $this->assertSame('DollarSign', $formatted['icon']);
        $this->assertSame('/portal/immigration/visa-types', $formatted['url']);
    }
}
