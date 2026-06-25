<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginRateLimitTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $email = 'staff@test.co', string $password = 'OldPass123'): User
    {
        return User::factory()->create(['email' => $email, 'password' => $password, 'role' => 'sales']);
    }

    /** Post a login from a specific client IP. */
    private function attempt(string $email, string $password, string $ip = '127.0.0.1')
    {
        return $this->withServerVariables(['REMOTE_ADDR' => $ip])
            ->post('/login', ['email' => $email, 'password' => $password]);
    }

    public function test_sixth_failed_attempt_returns_429(): void
    {
        $this->user();

        for ($i = 0; $i < 5; $i++) {
            $this->attempt('staff@test.co', 'wrong-password')->assertSessionHasErrors('email');
        }

        $this->attempt('staff@test.co', 'wrong-password')
            ->assertStatus(429)
            ->assertHeader('Retry-After');
    }

    public function test_successful_login_resets_the_counter(): void
    {
        $this->user();

        // Three fails, then a success clears the counter…
        for ($i = 0; $i < 3; $i++) {
            $this->attempt('staff@test.co', 'wrong-password');
        }
        $this->attempt('staff@test.co', 'OldPass123')->assertRedirect();
        $this->post('/logout');

        // …so a fresh run of 5 fails is needed again before lockout.
        for ($i = 0; $i < 5; $i++) {
            $this->attempt('staff@test.co', 'wrong-password')->assertSessionHasErrors('email');
        }
        $this->attempt('staff@test.co', 'wrong-password')->assertStatus(429);
    }

    public function test_rate_limit_is_per_email(): void
    {
        $this->user('locked@test.co');
        $this->user('other@test.co');

        // Lock the first account from IP A.
        for ($i = 0; $i < 5; $i++) {
            $this->attempt('locked@test.co', 'wrong', '10.0.0.1');
        }
        $this->attempt('locked@test.co', 'wrong', '10.0.0.1')->assertStatus(429);

        // A different account from a different IP is unaffected.
        $this->attempt('other@test.co', 'OldPass123', '10.0.0.2')->assertRedirect();
    }

    public function test_rate_limit_is_also_tracked_per_ip(): void
    {
        // Five different (non-existent) emails from one IP trips the IP limiter.
        for ($i = 0; $i < 5; $i++) {
            $this->attempt("nobody{$i}@test.co", 'wrong', '203.0.113.7');
        }

        // The 6th attempt from the same IP — even a brand-new email — is blocked.
        $this->attempt('fresh@test.co', 'wrong', '203.0.113.7')->assertStatus(429);
    }

    public function test_lockout_expires_after_the_decay_window(): void
    {
        $this->user();

        for ($i = 0; $i < 5; $i++) {
            $this->attempt('staff@test.co', 'wrong-password');
        }
        $this->attempt('staff@test.co', 'wrong-password')->assertStatus(429);

        // After the 60s window, attempts are allowed again.
        $this->travel(61)->seconds();
        $this->attempt('staff@test.co', 'OldPass123')->assertRedirect();
    }

    public function test_success_on_fourth_attempt_has_no_penalty(): void
    {
        $this->user();

        for ($i = 0; $i < 3; $i++) {
            $this->attempt('staff@test.co', 'wrong-password');
        }
        // 4th attempt succeeds — under the limit, no lockout.
        $this->attempt('staff@test.co', 'OldPass123')->assertRedirect();
        $this->assertAuthenticated();
    }
}
