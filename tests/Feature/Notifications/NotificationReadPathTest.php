<?php

namespace Tests\Feature\Notifications;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Str;
use Tests\TestCase;

class NotificationReadPathTest extends TestCase
{
    use RefreshDatabase;

    /** Insert a database notification directly (no dependency on a class). */
    private function makeNotification(User $user, array $data = [], ?string $readAt = null, ?string $createdAt = null): DatabaseNotification
    {
        return DatabaseNotification::create([
            'id'              => (string) Str::uuid(),
            'type'           => 'App\\Notifications\\Fake',
            'notifiable_type' => User::class,
            'notifiable_id'   => $user->id,
            'data'            => array_merge(['title' => 'Hi', 'body' => 'There'], $data),
            'read_at'         => $readAt,
            'created_at'      => $createdAt ?? now(),
            'updated_at'      => $createdAt ?? now(),
        ]);
    }

    public function test_unread_count_zero_for_user_with_none(): void
    {
        $user = User::factory()->create(['role' => 'sales']);

        $this->actingAs($user)
            ->getJson('/api/notifications/unread-count')
            ->assertOk()
            ->assertJson(['count' => 0]);
    }

    public function test_unread_count_reflects_real_notifications(): void
    {
        $user = User::factory()->create(['role' => 'sales']);
        $this->makeNotification($user);
        $this->makeNotification($user);
        $this->makeNotification($user, [], now()->toDateTimeString()); // already read

        $this->actingAs($user)
            ->getJson('/api/notifications/unread-count')
            ->assertOk()
            ->assertJson(['count' => 2]);
    }

    public function test_recent_returns_ten_most_recent_desc(): void
    {
        $user = User::factory()->create(['role' => 'sales']);
        for ($i = 0; $i < 12; $i++) {
            $this->makeNotification($user, ['title' => "N{$i}"], null, now()->subMinutes(12 - $i)->toDateTimeString());
        }

        $resp = $this->actingAs($user)->getJson('/api/notifications/recent')->assertOk();
        $resp->assertJsonCount(10, 'notifications');
        // Newest first: N11 created last.
        $this->assertSame('N11', $resp->json('notifications.0.data.title'));
    }

    public function test_mark_as_read_marks_single(): void
    {
        $user = User::factory()->create(['role' => 'sales']);
        $n = $this->makeNotification($user);

        $this->actingAs($user)
            ->postJson("/notifications/{$n->id}/read")
            ->assertOk();

        $this->assertNotNull($n->fresh()->read_at);
    }

    public function test_mark_all_as_read(): void
    {
        $user = User::factory()->create(['role' => 'sales']);
        $this->makeNotification($user);
        $this->makeNotification($user);

        $this->actingAs($user)
            ->postJson('/notifications/mark-all-read')
            ->assertOk();

        $this->assertSame(0, $user->fresh()->unreadNotifications()->count());
    }

    public function test_destroy_removes_notification(): void
    {
        $user = User::factory()->create(['role' => 'sales']);
        $n = $this->makeNotification($user);

        $this->actingAs($user)
            ->deleteJson("/notifications/{$n->id}")
            ->assertOk();

        $this->assertDatabaseMissing('notifications', ['id' => $n->id]);
    }

    public function test_user_cannot_touch_or_see_others_notifications(): void
    {
        $alice = User::factory()->create(['role' => 'sales']);
        $bob = User::factory()->create(['role' => 'sales']);
        $bobsNote = $this->makeNotification($bob);

        // Alice's recent feed excludes Bob's note.
        $this->actingAs($alice)->getJson('/api/notifications/recent')->assertJsonCount(0, 'notifications');

        // Alice cannot mark or delete Bob's note.
        $this->actingAs($alice)->postJson("/notifications/{$bobsNote->id}/read")->assertNotFound();
        $this->actingAs($alice)->deleteJson("/notifications/{$bobsNote->id}")->assertNotFound();

        $this->assertNull($bobsNote->fresh()->read_at);
    }

    public function test_guest_gets_401(): void
    {
        $this->getJson('/api/notifications/unread-count')->assertUnauthorized();
        $this->getJson('/api/notifications/recent')->assertUnauthorized();
        $this->postJson('/notifications/mark-all-read')->assertUnauthorized();
    }
}
