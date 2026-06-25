<?php

namespace Tests\Feature\Tracker;

use App\Models\Agreement;
use App\Models\AgreementTemplate;
use App\Models\Lead;
use App\Models\User;
use App\Notifications\AgreementSignedNotification;
use App\Services\PdfGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Build 11.D Phase 3 — Signature capture: audit fields, notification
 * routing (including assignee → admin fallback), validation, and the
 * idempotency guarantees on the sign endpoint.
 */
class SignatureCaptureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->app->bind(PdfGenerator::class, fn () => new class extends PdfGenerator {
            public function renderToFile(string $html, string $relativePath, string $paper = 'a4'): string
            {
                return $relativePath;
            }
        });
    }

    private function makeCase(array $attrs = []): Lead
    {
        return Lead::create(array_merge([
            'first_name'          => 'Maria',
            'last_name'           => 'Cruz',
            'email'               => 'maria@example.test',
            'is_immigration_case' => true,
        ], $attrs));
    }

    private function makeSentAgreement(Lead $case, array $extra = []): Agreement
    {
        $template = AgreementTemplate::firstOrCreate(
            ['name' => 'Test Template'],
            ['body' => 'body', 'is_active' => true],
        );
        return Agreement::create(array_merge([
            'lead_id'               => $case->id,
            'agreement_template_id' => $template->id,
            'generated_by_user_id'  => User::factory()->create(['role' => 'immigration'])->id,
            'title'                 => 'Test Agreement',
            'content_rendered'      => 'body',
            'status'                => 'sent',
            'tracker_signing_token' => str_repeat('s', 48),
            'sent_at'               => now(),
        ], $extra));
    }

    private function signPayload(array $overrides = []): array
    {
        return array_merge([
            'signer_name'    => 'Maria Cruz',
            'signature_data' => 'data:image/png;base64,iVBORw0KGgo=',
            'terms_accepted' => 1,
        ], $overrides);
    }

    public function test_01_signature_captures_signer_name_ip_timestamp_user_agent(): void
    {
        $case = $this->makeCase();
        $agreement = $this->makeSentAgreement($case);

        $this->withServerVariables(['HTTP_USER_AGENT' => 'TestBot/1.0 (PHPUnit)'])
            ->post(
                "/track/{$case->tracking_code}/agreements/{$agreement->tracker_signing_token}/sign",
                $this->signPayload(['signer_name' => 'Maria Cruz']),
            );

        $fresh = $agreement->fresh();
        $this->assertSame('Maria Cruz', $fresh->signer_name);
        $this->assertNotNull($fresh->signer_ip);
        $this->assertNotNull($fresh->signed_at);
        $this->assertSame('TestBot/1.0 (PHPUnit)', $fresh->signer_user_agent);
    }

    public function test_02_signing_changes_status_to_signed(): void
    {
        $case = $this->makeCase();
        $agreement = $this->makeSentAgreement($case);

        $this->post("/track/{$case->tracking_code}/agreements/{$agreement->tracker_signing_token}/sign", $this->signPayload());

        $this->assertSame('signed', $agreement->fresh()->status);
    }

    public function test_03_signing_generates_signed_pdf_path(): void
    {
        $case = $this->makeCase();
        $agreement = $this->makeSentAgreement($case);

        $this->post("/track/{$case->tracking_code}/agreements/{$agreement->tracker_signing_token}/sign", $this->signPayload());

        $this->assertNotNull($agreement->fresh()->signed_pdf_path);
        $this->assertStringContainsString("agreements/{$case->id}/signed-", $agreement->fresh()->signed_pdf_path);
    }

    public function test_04_signing_notifies_assignee_when_one_exists(): void
    {
        Notification::fake();
        $assignee = User::factory()->create(['role' => 'immigration']);
        $case = $this->makeCase(['assigned_to' => $assignee->id]);
        $agreement = $this->makeSentAgreement($case);

        $this->post("/track/{$case->tracking_code}/agreements/{$agreement->tracker_signing_token}/sign", $this->signPayload());

        Notification::assertSentTo($assignee, AgreementSignedNotification::class);
    }

    public function test_05_signing_falls_back_to_admins_when_no_assignee(): void
    {
        Notification::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $immigrationMgr = User::factory()->create(['role' => 'immigration_manager']);
        $unrelated = User::factory()->create(['role' => 'sales']);

        $case = $this->makeCase(['assigned_to' => null]);
        $agreement = $this->makeSentAgreement($case);

        $this->post("/track/{$case->tracking_code}/agreements/{$agreement->tracker_signing_token}/sign", $this->signPayload());

        Notification::assertSentTo($admin, AgreementSignedNotification::class);
        Notification::assertSentTo($immigrationMgr, AgreementSignedNotification::class);
        Notification::assertNotSentTo($unrelated, AgreementSignedNotification::class);
    }

    public function test_06_cannot_sign_already_signed_agreement(): void
    {
        $case = $this->makeCase();
        $agreement = $this->makeSentAgreement($case, [
            'status'      => 'signed',
            'signed_at'   => now(),
            'signer_name' => 'Earlier signer',
        ]);

        $this->post("/track/{$case->tracking_code}/agreements/{$agreement->tracker_signing_token}/sign", $this->signPayload())
            ->assertNotFound();

        // Original signer info unchanged.
        $this->assertSame('Earlier signer', $agreement->fresh()->signer_name);
    }

    public function test_07_cannot_sign_voided_agreement(): void
    {
        $case = $this->makeCase();
        $agreement = $this->makeSentAgreement($case, ['status' => 'voided']);

        $this->post("/track/{$case->tracking_code}/agreements/{$agreement->tracker_signing_token}/sign", $this->signPayload())
            ->assertNotFound();
    }

    public function test_08_validation_rejects_empty_signature_data(): void
    {
        $case = $this->makeCase();
        $agreement = $this->makeSentAgreement($case);

        $this->post(
            "/track/{$case->tracking_code}/agreements/{$agreement->tracker_signing_token}/sign",
            $this->signPayload(['signature_data' => '']),
        )->assertSessionHasErrors('signature_data');
    }

    public function test_09_validation_rejects_oversized_signature_data(): void
    {
        $case = $this->makeCase();
        $agreement = $this->makeSentAgreement($case);

        // 5MB + 1 — should be rejected by the max:5000000 rule.
        $oversized = str_repeat('A', 5_000_001);

        $this->post(
            "/track/{$case->tracking_code}/agreements/{$agreement->tracker_signing_token}/sign",
            $this->signPayload(['signature_data' => $oversized]),
        )->assertSessionHasErrors('signature_data');
    }

    public function test_10_validation_rejects_unchecked_terms(): void
    {
        $case = $this->makeCase();
        $agreement = $this->makeSentAgreement($case);

        $this->post(
            "/track/{$case->tracking_code}/agreements/{$agreement->tracker_signing_token}/sign",
            $this->signPayload(['terms_accepted' => 0]),
        )->assertSessionHasErrors('terms_accepted');
    }

    public function test_11_double_post_does_not_re_sign(): void
    {
        // Idempotency: second submission for a now-signed agreement must
        // 404 (the status check rejects), and signer_name/signed_at must
        // reflect the FIRST submission only.
        $case = $this->makeCase();
        $agreement = $this->makeSentAgreement($case);

        $this->post(
            "/track/{$case->tracking_code}/agreements/{$agreement->tracker_signing_token}/sign",
            $this->signPayload(['signer_name' => 'First Click']),
        )->assertRedirect();
        $firstSignedAt = $agreement->fresh()->signed_at;

        $this->post(
            "/track/{$case->tracking_code}/agreements/{$agreement->tracker_signing_token}/sign",
            $this->signPayload(['signer_name' => 'Second Click']),
        )->assertNotFound();

        $this->assertSame('First Click', $agreement->fresh()->signer_name);
        $this->assertTrue($firstSignedAt->equalTo($agreement->fresh()->signed_at));
    }
}
