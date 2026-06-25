<?php

namespace Tests\Feature\Notifications;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NotificationPageTest extends TestCase
{
    use RefreshDatabase;

    private function note(User $user, ?string $readAt = null, string $title = 'Hi'): DatabaseNotification
    {
        return DatabaseNotification::create([
            'id'              => (string) Str::uuid(),
            'type'           => 'App\\Notifications\\LeadAssignedToYou',
            'notifiable_type' => User::class,
            'notifiable_id'   => $user->id,
            'data'            => ['title' => $title, 'body' => 'body', 'link' => '/admin/leads/1'],
            'read_at'         => $readAt,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
    }

    public function test_index_renders_200_for_authenticated_user(): void
    {
        $user = User::factory()->create(['role' => 'sales']);
        $this->note($user);

        $this->actingAs($user)
            ->get('/notifications')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('portal/sales/Notifications')
                ->has('notifications.data', 1)
                ->has('counts')
            );
    }

    public function test_filter_unread_returns_only_unread(): void
    {
        $user = User::factory()->create(['role' => 'sales']);
        $this->note($user);                                  // unread
        $this->note($user, now()->toDateTimeString());       // read

        $this->actingAs($user)
            ->get('/notifications?filter=unread')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filter', 'unread')
                ->has('notifications.data', 1)
                ->where('notifications.data.0.is_read', false)
            );
    }

    public function test_filter_read_returns_only_read(): void
    {
        $user = User::factory()->create(['role' => 'sales']);
        $this->note($user);                                  // unread
        $this->note($user, now()->toDateTimeString());       // read

        $this->actingAs($user)
            ->get('/notifications?filter=read')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('notifications.data', 1)
                ->where('notifications.data.0.is_read', true)
            );
    }

    public function test_clicking_notification_marks_it_read(): void
    {
        $user = User::factory()->create(['role' => 'sales']);
        $n = $this->note($user);

        $this->actingAs($user)->post("/notifications/{$n->id}/read")->assertRedirect();

        $this->assertNotNull($n->fresh()->read_at);
    }

    public function test_mark_all_read(): void
    {
        $user = User::factory()->create(['role' => 'sales']);
        $this->note($user);
        $this->note($user);

        $this->actingAs($user)->post('/notifications/mark-all-read')->assertRedirect();

        $this->assertSame(0, $user->fresh()->unreadNotifications()->count());
    }

    public function test_pagination_two_pages(): void
    {
        $user = User::factory()->create(['role' => 'sales']);
        for ($i = 0; $i < 30; $i++) {
            $this->note($user, null, "N{$i}");
        }

        // Page size is 20 → 30 notifications spans two pages.
        $this->actingAs($user)
            ->get('/notifications')
            ->assertInertia(fn (Assert $page) => $page->has('notifications.data', 20));

        $this->actingAs($user)
            ->get('/notifications?page=2')
            ->assertInertia(fn (Assert $page) => $page->has('notifications.data', 10));
    }

    public function test_guest_redirected_to_login(): void
    {
        $this->get('/notifications')->assertRedirect('/login');
    }
}
