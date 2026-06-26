<?php

namespace Tests\Unit\Services;

use App\Models\Agreement;
use App\Models\AgreementTemplate;
use App\Models\Lead;
use App\Models\User;
use App\Services\Immigration\StubSignatureProvider;
use App\Services\PdfGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

/**
 * Build 11.D Phase 3 — StubSignatureProvider unit coverage.
 *
 * The provider is the seam Build 11.E will rebind. These tests pin the
 * stub's behaviour (URL shape, payload validation, audit capture) so a
 * future swap can be compared against a known baseline.
 */
class StubSignatureProviderTest extends TestCase
{
    use RefreshDatabase;

    private function provider(): StubSignatureProvider
    {
        return new StubSignatureProvider(
            new class extends PdfGenerator {
                public function renderToFile(string $html, string $relativePath, string $paper = 'a4'): string
                {
                    return $relativePath;
                }
            }
        );
    }

    private function makeAgreement(array $attrs = []): Agreement
    {
        $lead = Lead::create([
            'first_name'          => 'Maria',
            'last_name'           => 'Cruz',
            'email'               => 'maria@example.test',
            'is_immigration_case' => true,
        ]);
        $template = AgreementTemplate::create([
            'name'      => 'T',
            'body'      => 'body',
            'is_active' => true,
        ]);
        return Agreement::create(array_merge([
            'lead_id'               => $lead->id,
            'agreement_template_id' => $template->id,
            'generated_by_user_id'  => User::factory()->create()->id,
            'title'                 => 'T',
            'content_rendered'      => 'body',
            'status'                => 'sent',
            'tracker_signing_token' => str_repeat('t', 48),
            'sent_at'               => now(),
        ], $attrs));
    }

    public function test_01_create_signing_session_returns_tracker_url_with_token(): void
    {
        $agreement = $this->makeAgreement();
        $agreement->load('lead');

        $url = $this->provider()->createSigningSession($agreement);

        $this->assertStringContainsString("/track/{$agreement->lead->tracking_code}/agreements/", $url);
        $this->assertStringContainsString("/{$agreement->tracker_signing_token}/sign", $url);
    }

    public function test_02_create_signing_session_returns_empty_when_token_missing(): void
    {
        // Caller error — agreement was never sent (still in draft).
        $agreement = $this->makeAgreement(['tracker_signing_token' => null, 'status' => 'draft']);
        $agreement->load('lead');

        $this->assertSame('', $this->provider()->createSigningSession($agreement));
    }

    public function test_03_record_signature_rejects_empty_signer_name(): void
    {
        $agreement = $this->makeAgreement();
        $request = Request::create('/sign', 'POST');

        $ok = $this->provider()->recordSignature($agreement, [
            'signer_name'    => '',
            'signature_data' => 'data:image/png;base64,iVBORw0KGgo=',
        ], $request);

        $this->assertFalse($ok);
        $this->assertSame('sent', $agreement->fresh()->status); // unchanged
    }

    public function test_04_record_signature_rejects_empty_signature_data(): void
    {
        $agreement = $this->makeAgreement();
        $request = Request::create('/sign', 'POST');

        $ok = $this->provider()->recordSignature($agreement, [
            'signer_name'    => 'Maria Cruz',
            'signature_data' => '',
        ], $request);

        $this->assertFalse($ok);
    }

    public function test_05_record_signature_stamps_all_audit_fields(): void
    {
        $agreement = $this->makeAgreement();
        $request = Request::create('/sign', 'POST', server: [
            'REMOTE_ADDR'     => '10.0.0.42',
            'HTTP_USER_AGENT' => 'TestBot/1.0',
        ]);

        $ok = $this->provider()->recordSignature($agreement, [
            'signer_name'    => 'Maria Cruz',
            'signature_data' => 'data:image/png;base64,iVBORw0KGgo=',
        ], $request);

        $this->assertTrue($ok);
        $fresh = $agreement->fresh();
        $this->assertSame('signed', $fresh->status);
        $this->assertSame('Maria Cruz', $fresh->signer_name);
        $this->assertSame('10.0.0.42', $fresh->signer_ip);
        $this->assertSame('TestBot/1.0', $fresh->signer_user_agent);
        $this->assertNotNull($fresh->signed_at);
    }

    public function test_06_record_signature_generates_signed_pdf_path(): void
    {
        $agreement = $this->makeAgreement();
        $request = Request::create('/sign', 'POST');

        $this->provider()->recordSignature($agreement, [
            'signer_name'    => 'Maria Cruz',
            'signature_data' => 'data:image/png;base64,iVBORw0KGgo=',
        ], $request);

        $fresh = $agreement->fresh();
        $this->assertNotNull($fresh->signed_pdf_path);
        $this->assertStringStartsWith("agreements/{$agreement->lead_id}/signed-", $fresh->signed_pdf_path);
    }
}
