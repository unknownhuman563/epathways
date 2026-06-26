<?php

namespace Tests\Feature\Immigration;

use App\Models\Agreement;
use App\Models\AgreementTemplate;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Build 11.D Phase 2 — Agreement send lifecycle.
 *
 * Send transitions draft → sent, generates the tracker_signing_token
 * (the bearer credential Phase 3's TrackerAgreementController resolves
 * against), and stamps sent_at. Signed / voided agreements cannot be
 * re-sent.
 */
class AgreementSendTest extends TestCase
{
    use RefreshDatabase;

    private function makeCase(array $attrs = []): Lead
    {
        return Lead::create(array_merge([
            'first_name'          => 'Maria',
            'last_name'           => 'Cruz',
            'email'               => 'maria@example.test',
            'is_immigration_case' => true,
        ], $attrs));
    }

    private function makeAgreement(Lead $case, string $status = 'draft', array $extra = []): Agreement
    {
        $template = AgreementTemplate::firstOrCreate(
            ['name' => 'Test'],
            ['body' => 'body', 'is_active' => true],
        );
        return Agreement::create(array_merge([
            'lead_id'               => $case->id,
            'agreement_template_id' => $template->id,
            'generated_by_user_id'  => User::factory()->create(['role' => 'immigration'])->id,
            'title'                 => 'Test',
            'content_rendered'      => 'body',
            'status'                => $status,
        ], $extra));
    }

    public function test_sending_draft_changes_status_to_sent(): void
    {
        $case      = $this->makeCase();
        $agreement = $this->makeAgreement($case, 'draft');

        $this->actingAs(User::factory()->create(['role' => 'immigration']))
            ->postJson("/portal/immigration/cases/{$case->id}/agreements/{$agreement->id}/send")
            ->assertOk()
            ->assertJsonPath('agreement.status', 'sent');

        $this->assertSame('sent', $agreement->fresh()->status);
    }

    public function test_sending_stamps_sent_at(): void
    {
        $case      = $this->makeCase();
        $agreement = $this->makeAgreement($case, 'draft');

        $this->actingAs(User::factory()->create(['role' => 'immigration']))
            ->postJson("/portal/immigration/cases/{$case->id}/agreements/{$agreement->id}/send")
            ->assertOk();

        $this->assertNotNull($agreement->fresh()->sent_at);
    }

    public function test_sending_creates_tracker_signing_token(): void
    {
        $case      = $this->makeCase();
        $agreement = $this->makeAgreement($case, 'draft');
        $this->assertNull($agreement->tracker_signing_token);

        $this->actingAs(User::factory()->create(['role' => 'immigration']))
            ->postJson("/portal/immigration/cases/{$case->id}/agreements/{$agreement->id}/send")
            ->assertOk();

        $token = $agreement->fresh()->tracker_signing_token;
        $this->assertNotNull($token);
        $this->assertSame(48, strlen($token));
    }

    public function test_cannot_send_already_signed_agreement(): void
    {
        $case      = $this->makeCase();
        $agreement = $this->makeAgreement($case, 'signed', ['signed_at' => now()]);

        $this->actingAs(User::factory()->create(['role' => 'immigration']))
            ->postJson("/portal/immigration/cases/{$case->id}/agreements/{$agreement->id}/send")
            ->assertStatus(422);
    }

    public function test_cannot_send_voided_agreement(): void
    {
        $case      = $this->makeCase();
        $agreement = $this->makeAgreement($case, 'voided');

        $this->actingAs(User::factory()->create(['role' => 'immigration']))
            ->postJson("/portal/immigration/cases/{$case->id}/agreements/{$agreement->id}/send")
            ->assertStatus(422);
    }

    public function test_sales_staff_cannot_send_agreement(): void
    {
        $case      = $this->makeCase();
        $agreement = $this->makeAgreement($case, 'draft');

        $this->actingAs(User::factory()->create(['role' => 'sales']))
            ->postJson("/portal/immigration/cases/{$case->id}/agreements/{$agreement->id}/send")
            ->assertForbidden();
    }

    /**
     * Idempotency contract: a second send() on the same agreement must
     * 422 (the natural status-guard outcome — already 'sent', no longer
     * 'draft') and MUST NOT regenerate the tracker_signing_token. The
     * token is single-use semantically; rotating it would break the URL
     * the client already received.
     */
    public function test_send_called_twice_does_not_regenerate_token(): void
    {
        $case      = $this->makeCase();
        $agreement = $this->makeAgreement($case, 'draft');

        $this->actingAs(User::factory()->create(['role' => 'immigration']))
            ->postJson("/portal/immigration/cases/{$case->id}/agreements/{$agreement->id}/send")
            ->assertOk();

        $firstToken = $agreement->fresh()->tracker_signing_token;
        $this->assertNotNull($firstToken);

        // Second send: status is now 'sent' (not 'draft'), service rejects.
        $this->actingAs(User::factory()->create(['role' => 'immigration']))
            ->postJson("/portal/immigration/cases/{$case->id}/agreements/{$agreement->id}/send")
            ->assertStatus(422);

        $this->assertSame($firstToken, $agreement->fresh()->tracker_signing_token);
    }
}
