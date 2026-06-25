<?php

namespace Tests\Unit\Services;

use App\Exceptions\MissingAgreementVariablesException;
use App\Models\Agreement;
use App\Models\AgreementTemplate;
use App\Models\Lead;
use App\Models\User;
use App\Services\Immigration\AgreementService;
use App\Services\PdfGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

/**
 * Build 11.D Phase 2 — AgreementService unit coverage.
 *
 * PdfGenerator is replaced with a fake that records the call but skips
 * actual dompdf rendering — keeps the unit tests fast and avoids the
 * dompdf binary on CI.
 */
class AgreementServiceTest extends TestCase
{
    use RefreshDatabase;

    private function service(): AgreementService
    {
        return new AgreementService(new class extends PdfGenerator {
            public string $lastHtml = '';
            public string $lastPath = '';
            public function renderToFile(string $html, string $relativePath, string $paper = 'a4'): string
            {
                $this->lastHtml = $html;
                $this->lastPath = $relativePath;
                return $relativePath;
            }
        });
    }

    private function makeLead(array $attrs = []): Lead
    {
        return Lead::create(array_merge([
            'first_name'          => 'Pat',
            'last_name'           => 'Patel',
            'email'               => 'pat.patel@example.test',
            'phone'               => '+64 21 555 0100',
            'is_immigration_case' => true,
            'inz_visa_type'       => 'Skilled Migrant Category',
        ], $attrs));
    }

    private function makeTemplate(array $attrs = []): AgreementTemplate
    {
        return AgreementTemplate::create(array_merge([
            'name'               => 'Test Template',
            'visa_type'          => null,
            'body'               => 'Hello {{client_name}}, fee is {{total_fee}}.',
            'required_variables' => null,
            'is_active'          => true,
        ], $attrs));
    }

    public function test_01_resolve_variables_combines_lead_and_extras(): void
    {
        Auth::login(User::factory()->create(['name' => 'Consultant Cara', 'role' => 'immigration']));
        $lead = $this->makeLead();

        $vars = $this->service()->resolveVariables($lead, ['total_fee' => 'NZD 4000', 'payment_terms' => '50/50']);

        $this->assertSame('Pat Patel', $vars['client_name']);
        $this->assertSame('Skilled Migrant Category', $vars['visa_type']);
        $this->assertSame('Consultant Cara', $vars['consultant_name']);
        $this->assertSame('NZD 4000', $vars['total_fee']);
        $this->assertSame('50/50', $vars['payment_terms']);
    }

    public function test_02_render_template_substitutes_handlebars_syntax(): void
    {
        $rendered = $this->service()->renderTemplate(
            'Dear {{client_name}}, your {{visa_type}} fee is {{fee}}.',
            ['client_name' => 'Maria', 'visa_type' => 'SMC', 'fee' => '$2000']
        );

        $this->assertSame('Dear Maria, your SMC fee is $2000.', $rendered);
    }

    public function test_03_render_template_marks_missing_variables(): void
    {
        $rendered = $this->service()->renderTemplate(
            'Hello {{client_name}}, total {{nonexistent}}.',
            ['client_name' => 'Pat']
        );

        $this->assertStringContainsString('Hello Pat', $rendered);
        $this->assertStringContainsString('[nonexistent not provided]', $rendered);
    }

    public function test_04_find_missing_required_returns_unfilled_keys(): void
    {
        $template = $this->makeTemplate(['required_variables' => ['total_fee', 'payment_terms', 'scope']]);
        $missing = $this->service()->findMissingRequired($template, [
            'total_fee'     => 'NZD 4000',
            'payment_terms' => '',
            // scope absent
        ]);

        $this->assertEqualsCanonicalizing(['payment_terms', 'scope'], $missing);
    }

    public function test_05_generate_creates_agreement_record_with_pdf_path(): void
    {
        Auth::login(User::factory()->create(['role' => 'immigration']));
        $lead     = $this->makeLead();
        $template = $this->makeTemplate();

        $agreement = $this->service()->generate($lead, $template);

        $this->assertInstanceOf(Agreement::class, $agreement);
        $this->assertSame($lead->id, $agreement->lead_id);
        $this->assertSame($template->id, $agreement->agreement_template_id);
        $this->assertSame(Agreement::STATUS_DRAFT, $agreement->status);
        $this->assertNotEmpty($agreement->pdf_path);
        $this->assertStringContainsString("agreements/{$lead->id}/", $agreement->pdf_path);
    }

    public function test_06_generate_stores_variables_used_audit_snapshot(): void
    {
        Auth::login(User::factory()->create(['role' => 'immigration']));
        $lead     = $this->makeLead();
        $template = $this->makeTemplate();

        $agreement = $this->service()->generate($lead, $template, ['total_fee' => 'NZD 4000']);

        $this->assertIsArray($agreement->variables_used);
        $this->assertSame('Pat Patel', $agreement->variables_used['client_name']);
        $this->assertSame('NZD 4000', $agreement->variables_used['total_fee']);
    }

    public function test_07_generate_throws_when_required_variables_missing(): void
    {
        Auth::login(User::factory()->create(['role' => 'immigration']));
        $lead     = $this->makeLead();
        $template = $this->makeTemplate(['required_variables' => ['total_fee', 'payment_terms']]);

        try {
            $this->service()->generate($lead, $template, ['total_fee' => 'NZD 4000']);
            $this->fail('Expected MissingAgreementVariablesException');
        } catch (MissingAgreementVariablesException $e) {
            $this->assertContains('payment_terms', $e->missing);
        }
    }
}
