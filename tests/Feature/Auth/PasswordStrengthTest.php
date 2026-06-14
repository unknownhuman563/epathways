<?php

namespace Tests\Feature\Auth;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordStrengthTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'email' => 'admin@test.co']);
    }

    private function createUser(string $password): \Illuminate\Testing\TestResponse
    {
        return $this->actingAs($this->admin())->post('/admin/users', [
            'name'     => 'New Staff',
            'email'    => 'new.staff@test.co',
            'role'     => 'sales',
            'password' => $password,
        ]);
    }

    public function test_user_creation_rejects_password_without_uppercase(): void
    {
        $this->createUser('lowercase1')->assertSessionHasErrors('password');
        $this->assertDatabaseMissing('users', ['email' => 'new.staff@test.co']);
    }

    public function test_user_creation_rejects_password_without_number(): void
    {
        $this->createUser('NoNumbersHere')->assertSessionHasErrors('password');
        $this->assertDatabaseMissing('users', ['email' => 'new.staff@test.co']);
    }

    public function test_user_creation_rejects_password_under_eight_chars(): void
    {
        $this->createUser('Ab1')->assertSessionHasErrors('password');
        $this->assertDatabaseMissing('users', ['email' => 'new.staff@test.co']);
    }

    public function test_user_creation_succeeds_with_strong_password(): void
    {
        $this->createUser('StrongPass1')->assertSessionHasNoErrors();
        $this->assertDatabaseHas('users', ['email' => 'new.staff@test.co', 'role' => 'sales']);
    }

    public function test_lead_portal_setup_rejects_weak_password(): void
    {
        $this->post('/lead-portal/setup/anytoken', [
            'password'              => 'weak',
            'password_confirmation' => 'weak',
        ])->assertSessionHasErrors('password');
    }

    public function test_lead_portal_setup_accepts_strong_password(): void
    {
        // A usable invitation (status 'sent', unexpired, hashed token).
        $plain = 'plain-token-123';
        $lead = Lead::create([
            'first_name'                   => 'Client',
            'last_name'                    => 'Lead',
            'email'                        => 'client@test.co',
            'portal_invitation_status'     => 'sent',
            'portal_invitation_token'      => hash('sha256', $plain),
            'portal_invitation_expires_at' => now()->addDays(3),
        ]);

        $this->post("/lead-portal/setup/{$plain}", [
            'password'              => 'StrongPass1',
            'password_confirmation' => 'StrongPass1',
        ])->assertSessionHasNoErrors();

        $user = User::where('lead_id', $lead->id)->first();
        $this->assertNotNull($user);
        $this->assertTrue(Hash::check('StrongPass1', $user->password));
    }
}
