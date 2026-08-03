<?php

namespace Tests\Feature\Immigration;

use App\Exceptions\StaleSignerLicenceException;
use App\Models\Lead;
use App\Models\User;
use App\Models\VisaType;
use App\Services\Immigration\EngagementDocumentGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Build 12 fast-follow — licence is admin-set + audited, and a pack can never
 * be generated under a lapsed signer (written advice under a dead licence).
 */
class LicenceAdministrationTest extends TestCase
{
    use RefreshDatabase;

    private function caseLead(): Lead
    {
        return Lead::create([
            'first_name' => 'Aroha', 'last_name' => 'Ngata',
            'email' => 'aroha@example.test', 'is_immigration_case' => true,
            'inz_visa_type' => 'Student Visa',
        ]);
    }

    private function signer(bool $current): User
    {
        return User::factory()->create([
            'role' => User::ROLE_IMMIGRATION_ADVISER,
            'iaa_licence_number' => 'IAA-3003',
            'iaa_licence_expiry' => $current ? now()->addYear() : now()->subDay(),
        ]);
    }

    // ── Generator guard ─────────────────────────────────────────────────────

    public function test_generator_refuses_a_stale_signer(): void
    {
        Storage::fake('local');
        $lead = $this->caseLead();
        $stale = $this->signer(current: false);

        // The guard runs before any rendering, so no PDF is produced and no
        // document row is written.
        $this->expectException(StaleSignerLicenceException::class);

        app(EngagementDocumentGenerator::class)
            ->generate($lead, 'written_agreement', ['signer_id' => $stale->id]);
    }

    public function test_no_pack_is_persisted_when_the_signer_is_stale(): void
    {
        Storage::fake('local');
        $lead = $this->caseLead();
        $stale = $this->signer(current: false);

        try {
            app(EngagementDocumentGenerator::class)
                ->generate($lead, 'written_agreement', ['signer_id' => $stale->id]);
        } catch (StaleSignerLicenceException $e) {
            // expected
        }

        $this->assertDatabaseCount('lead_documents', 0);
    }

    public function test_generator_allows_a_current_signer(): void
    {
        Storage::fake('local');
        VisaType::create([
            'code' => 'student_visa', 'name' => 'Student Visa', 'category' => 'Student',
            'consultation_price_nzd' => 250, 'active' => true, 'professional_fees' => 1000,
            'inz_application_fee' => 850,
        ]);
        $lead = $this->caseLead();
        $current = $this->signer(current: true);

        $doc = app(EngagementDocumentGenerator::class)
            ->generate($lead, 'written_agreement', ['signer_id' => $current->id]);

        $this->assertSame('engagement:written_agreement', $doc->source_variant);
        $this->assertSame($current->id, $doc->engagement_signer_id);
    }

    // ── Admin-set + audited ─────────────────────────────────────────────────

    public function test_admin_can_set_a_licence_and_it_is_audited(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $adviser = User::factory()->create(['role' => User::ROLE_IMMIGRATION_ADVISER]);

        $this->actingAs($admin)
            ->post("/admin/users/{$adviser->id}", [
                'name' => $adviser->name, 'email' => $adviser->email,
                'role' => User::ROLE_IMMIGRATION_ADVISER,
                'iaa_licence_number' => 'IAA-9001',
                'iaa_licence_type' => 'Full',
                'iaa_licence_expiry' => now()->addYear()->toDateString(),
            ])
            ->assertRedirect();

        $fresh = $adviser->fresh();
        $this->assertSame('IAA-9001', $fresh->iaa_licence_number);
        $this->assertTrue($fresh->holdsCurrentLicence());
        $this->assertDatabaseHas('activity_logs', ['action' => 'user.updated']);
    }

    public function test_a_licence_number_requires_an_expiry(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $adviser = User::factory()->create(['role' => User::ROLE_IMMIGRATION_ADVISER]);

        $this->actingAs($admin)
            ->post("/admin/users/{$adviser->id}", [
                'name' => $adviser->name, 'email' => $adviser->email,
                'role' => User::ROLE_IMMIGRATION_ADVISER,
                'iaa_licence_number' => 'IAA-9001', // no expiry
            ])
            ->assertSessionHasErrors('iaa_licence_expiry');

        $this->assertNull($adviser->fresh()->iaa_licence_number);
    }

    // ── Self-certification closed ───────────────────────────────────────────

    public function test_immigration_profile_no_longer_writes_licence(): void
    {
        $adviser = User::factory()->create([
            'role' => User::ROLE_IMMIGRATION_ADVISER,
            'iaa_licence_number' => null,
            'iaa_licence_expiry' => null,
        ]);

        $this->actingAs($adviser)
            ->from('/portal/immigration/profile')
            ->post('/portal/immigration/profile', [
                'iaa_licence_number' => 'SELF-CERT',
                'iaa_licence_type' => 'Full',
            ])
            ->assertRedirect();

        // The self-service write is gone — the adviser cannot certify their own
        // licence, so the gate stays closed until an admin sets it.
        $this->assertNull($adviser->fresh()->iaa_licence_number);
        $this->assertFalse($adviser->fresh()->holdsCurrentLicence());
    }
}
