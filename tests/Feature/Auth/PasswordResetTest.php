<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $email = 'staff@test.co'): User
    {
        return User::factory()->create([
            'email'    => $email,
            'password' => 'OldPass123',
            'role'     => 'sales',
        ]);
    }

    public function test_forgot_password_page_renders_for_guest(): void
    {
        $this->get('/forgot-password')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('auth/ForgotPassword'));
    }

    public function test_logged_in_user_redirected_away_from_forgot_password(): void
    {
        $this->actingAs($this->user())->get('/forgot-password')->assertRedirect();
    }

    public function test_forgot_password_with_valid_email_returns_success(): void
    {
        Notification::fake();
        $this->user();

        $this->post('/forgot-password', ['email' => 'staff@test.co'])
            ->assertRedirect()
            ->assertSessionHas('success');
    }

    public function test_forgot_password_with_unknown_email_also_returns_success(): void
    {
        Notification::fake();

        // No enumeration: same success response, no validation error.
        $this->post('/forgot-password', ['email' => 'nobody@test.co'])
            ->assertRedirect()
            ->assertSessionHas('success')
            ->assertSessionHasNoErrors();

        Notification::assertNothingSent();
    }

    public function test_forgot_password_fires_reset_notification(): void
    {
        Notification::fake();
        $user = $this->user();

        $this->post('/forgot-password', ['email' => 'staff@test.co']);

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_reset_link_with_valid_token_renders_form(): void
    {
        $user = $this->user();
        $token = Password::createToken($user);

        $this->get("/reset-password/{$token}?email=staff@test.co")
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->component('auth/ResetPassword')
                ->where('token', $token)
                ->where('email', 'staff@test.co'));
    }

    public function test_reset_with_invalid_token_shows_error(): void
    {
        $user = $this->user();
        $original = $user->password;

        $this->post('/reset-password', [
            'token'                 => 'totally-invalid-token',
            'email'                 => 'staff@test.co',
            'password'              => 'NewStrong1',
            'password_confirmation' => 'NewStrong1',
        ])->assertSessionHasErrors('email');

        $this->assertSame($original, $user->fresh()->password); // unchanged
    }

    public function test_reset_with_expired_token_shows_error(): void
    {
        $user = $this->user();
        $token = Password::createToken($user);

        // Age the token past the 60-minute window.
        DB::table('password_reset_tokens')->where('email', 'staff@test.co')
            ->update(['created_at' => now()->subMinutes(61)]);

        $this->post('/reset-password', [
            'token'                 => $token,
            'email'                 => 'staff@test.co',
            'password'              => 'NewStrong1',
            'password_confirmation' => 'NewStrong1',
        ])->assertSessionHasErrors('email');
    }

    public function test_reset_with_valid_token_and_password_succeeds(): void
    {
        $user = $this->user();
        $token = Password::createToken($user);

        $this->post('/reset-password', [
            'token'                 => $token,
            'email'                 => 'staff@test.co',
            'password'              => 'NewStrong1',
            'password_confirmation' => 'NewStrong1',
        ])->assertRedirect('/login');

        $this->assertTrue(Hash::check('NewStrong1', $user->fresh()->password));
    }

    public function test_reset_requires_password_confirmation_match(): void
    {
        $user = $this->user();
        $token = Password::createToken($user);

        $this->post('/reset-password', [
            'token'                 => $token,
            'email'                 => 'staff@test.co',
            'password'              => 'NewStrong1',
            'password_confirmation' => 'Different1',
        ])->assertSessionHasErrors('password');
    }

    public function test_reset_enforces_password_strength(): void
    {
        $user = $this->user();
        $token = Password::createToken($user);

        // "weak" — too short, no uppercase, no number.
        $this->post('/reset-password', [
            'token'                 => $token,
            'email'                 => 'staff@test.co',
            'password'              => 'weak',
            'password_confirmation' => 'weak',
        ])->assertSessionHasErrors('password');
    }

    public function test_user_can_log_in_with_new_password_after_reset(): void
    {
        $user = $this->user();
        $token = Password::createToken($user);

        $this->post('/reset-password', [
            'token'                 => $token,
            'email'                 => 'staff@test.co',
            'password'              => 'NewStrong1',
            'password_confirmation' => 'NewStrong1',
        ]);

        $this->post('/login', ['email' => 'staff@test.co', 'password' => 'NewStrong1'])
            ->assertRedirect();
        $this->assertAuthenticatedAs($user->fresh());
    }
}
