<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RememberMeLoginTest extends TestCase
{
    use RefreshDatabase;

    private function user(array $attrs = []): User
    {
        return User::factory()->create(array_merge([
            'email'          => 'staff@test.co',
            'password'       => 'OldPass123',
            'role'           => 'sales',
            'remember_token' => null,
        ], $attrs));
    }

    public function test_login_with_remember_sets_remember_cookie_and_token(): void
    {
        $user = $this->user();

        $response = $this->post('/login', [
            'email' => 'staff@test.co', 'password' => 'OldPass123', 'remember' => true,
        ]);

        $response->assertCookie(auth('web')->getRecallerName());
        $this->assertNotNull($user->fresh()->remember_token);
        $this->assertAuthenticatedAs($user->fresh());
    }

    public function test_login_without_remember_does_not_set_remember_token(): void
    {
        $user = $this->user();

        $this->post('/login', ['email' => 'staff@test.co', 'password' => 'OldPass123']);

        $this->assertNull($user->fresh()->remember_token);
        $this->assertAuthenticatedAs($user->fresh());
    }

    public function test_remember_me_issues_a_persistent_cookie_surviving_browser_close(): void
    {
        // The recaller cookie is what lets the session survive a browser
        // close: unlike the session cookie it carries a far-future expiry,
        // and the matching remember_token is persisted so the next visit
        // re-authenticates from it (Laravel's viaRemember mechanism).
        $user = $this->user();

        $response = $this->post('/login', [
            'email' => 'staff@test.co', 'password' => 'OldPass123', 'remember' => true,
        ]);

        $cookie = collect($response->headers->getCookies())
            ->first(fn ($c) => $c->getName() === auth('web')->getRecallerName());

        $this->assertNotNull($cookie, 'recaller cookie should be issued');
        // Far-future expiry → not a session cookie (which would be 0 / on-close).
        $this->assertGreaterThan(now()->addDays(1)->timestamp, $cookie->getExpiresTime());
        $this->assertNotNull($user->fresh()->remember_token);
    }

    public function test_login_with_invalid_email_format_is_rejected(): void
    {
        $this->user();

        // No account has this garbage value → rejected (previously accepted).
        $this->postJson('/login', ['email' => 'notanemail', 'password' => 'whatever'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');

        $this->assertGuest();
    }

    public function test_existing_username_style_account_still_logs_in(): void
    {
        // The one legacy RFC-invalid email from the audit — must keep working.
        $user = User::factory()->create([
            'email' => 'adminepathways', 'password' => 'OldPass123', 'role' => 'admin',
        ]);

        $this->post('/login', ['email' => 'adminepathways', 'password' => 'OldPass123'])
            ->assertRedirect();

        $this->assertAuthenticatedAs($user);
    }
}
