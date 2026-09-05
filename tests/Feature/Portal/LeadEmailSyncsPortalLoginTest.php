<?php

namespace Tests\Feature\Portal;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A client's portal login is a separate User row whose `email` is the sign-in
 * identifier. When staff change the lead's email, the login must follow — else
 * the client keeps logging in with the old address while mail goes to the new.
 * Handled once in LeadObserver so every write path is covered.
 */
class LeadEmailSyncsPortalLoginTest extends TestCase
{
    use RefreshDatabase;

    private function leadWithPortal(string $email, string $role = User::ROLE_LEAD): Lead
    {
        $lead = Lead::create([
            'first_name' => 'Emma', 'last_name' => 'Client', 'email' => $email,
            'status' => 'New Leads',
        ]);

        User::create([
            'name' => 'Emma Client', 'email' => $email, 'password' => 'secret-pass-1',
            'role' => $role, 'lead_id' => $lead->id,
        ]);

        return $lead;
    }

    public function test_changing_lead_email_syncs_the_portal_login(): void
    {
        $lead = $this->leadWithPortal('old@example.com');

        $lead->update(['email' => 'new@example.com']);

        $this->assertSame('new@example.com', $lead->portalUser->fresh()->email);
    }

    public function test_revoked_account_is_not_resynced(): void
    {
        $lead = $this->leadWithPortal('old@example.com', User::ROLE_REVOKED_LEAD);

        $lead->update(['email' => 'new@example.com']);

        $this->assertSame('old@example.com', $lead->portalUser->fresh()->email);
    }

    public function test_collision_with_another_account_leaves_login_untouched(): void
    {
        $lead = $this->leadWithPortal('old@example.com');
        User::factory()->create(['email' => 'taken@example.com']);

        $lead->update(['email' => 'taken@example.com']);

        // Login stays on the old address rather than throwing / 500ing the edit.
        $this->assertSame('old@example.com', $lead->portalUser->fresh()->email);
    }

    public function test_clearing_the_email_does_not_wipe_the_login(): void
    {
        $lead = $this->leadWithPortal('old@example.com');

        $lead->update(['email' => null]);

        $this->assertSame('old@example.com', $lead->portalUser->fresh()->email);
    }
}
