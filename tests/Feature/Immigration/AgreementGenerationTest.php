<?php

namespace Tests\Feature\Immigration;

use App\Models\Agreement;
use App\Models\AgreementTemplate;
use App\Models\Lead;
use App\Models\User;
use App\Services\PdfGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Build 11.D Phase 2 — HTTP coverage for agreement generation, void,
 * and PDF download. Role gate mirrors CaseProfileController.
 *
 * PdfGenerator is swapped for a fake in setUp so we don't actually run
 * dompdf during the feature suite (it's slow and writes real files);
 * the path the fake "returns" is still recorded on the agreement row
 * so downstream assertions work.
 */
class AgreementGenerationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->app->bind(PdfGenerator::class, fn () => new class extends PdfGenerator {
            public function renderToFile(string $html, string $relativePath, string $paper = 'a4'): string
            {
                return $relativePath; // skip the actual dompdf write
            }
        });
    }

    private function makeCase(array $attrs = []): Lead
    {
        return Lead::create(array_merge([
            'first_name'          => 'Maria',
            'last_name'           => 'Cruz',
            'email'               => 'maria.cruz@example.test',
            'is_immigration_case' => true,
            'inz_visa_type'       => 'Skilled Migrant Category',
        ], $attrs));
    }

    private function makeTemplate(array $attrs = []): AgreementTemplate
    {
        return AgreementTemplate::create(array_merge([
            'name'               => 'Test Template',
            'visa_type'          => null,
            'body'               => 'Dear {{client_name}}, your fee is {{total_fee}}.',
            'required_variables' => null,
            'is_active'          => true,
        ], $attrs));
    }

    public function test_consultant_can_generate_agreement_from_template(): void
    {
        $case     = $this->makeCase();
        $template = $this->makeTemplate();
        $user     = User::factory()->create(['role' => 'immigration']);

        $this->actingAs($user)
            ->postJson("/portal/immigration/cases/{$case->id}/agreements", [
                'agreement_template_id' => $template->id,
            ])
            ->assertStatus(201)
            ->assertJsonPath('agreement.status', 'draft')
            ->assertJsonPath('agreement.title', 'Test Template');

        $this->assertDatabaseHas('agreements', [
            'lead_id'               => $case->id,
            'agreement_template_id' => $template->id,
            'generated_by_user_id'  => $user->id,
            'status'                => 'draft',
        ]);
    }

    public function test_generated_agreement_has_pdf_path_recorded(): void
    {
        $case     = $this->makeCase();
        $template = $this->makeTemplate();

        $this->actingAs(User::factory()->create(['role' => 'immigration']))
            ->postJson("/portal/immigration/cases/{$case->id}/agreements", [
                'agreement_template_id' => $template->id,
            ])
            ->assertStatus(201);

        $agreement = Agreement::firstOrFail();
        $this->assertNotEmpty($agreement->pdf_path);
        $this->assertStringContainsString("agreements/{$case->id}/", $agreement->pdf_path);
    }

    public function test_variables_are_substituted_into_rendered_content(): void
    {
        $case     = $this->makeCase();
        $template = $this->makeTemplate();

        $this->actingAs(User::factory()->create(['role' => 'immigration']))
            ->postJson("/portal/immigration/cases/{$case->id}/agreements", [
                'agreement_template_id' => $template->id,
                'extra_variables'       => ['total_fee' => 'NZD 4000'],
            ])
            ->assertStatus(201);

        $agreement = Agreement::firstOrFail();
        $this->assertStringContainsString('Dear Maria Cruz', $agreement->content_rendered);
        $this->assertStringContainsString('NZD 4000', $agreement->content_rendered);
        $this->assertStringNotContainsString('{{client_name}}', $agreement->content_rendered);
    }

    public function test_missing_required_variables_returns_422_with_list(): void
    {
        $case     = $this->makeCase();
        $template = $this->makeTemplate([
            'required_variables' => ['total_fee', 'payment_terms'],
        ]);

        $this->actingAs(User::factory()->create(['role' => 'immigration']))
            ->postJson("/portal/immigration/cases/{$case->id}/agreements", [
                'agreement_template_id' => $template->id,
                'extra_variables'       => ['total_fee' => 'NZD 4000'],
            ])
            ->assertStatus(422)
            ->assertJsonPath('missing.0', 'payment_terms');

        $this->assertDatabaseCount('agreements', 0);
    }

    public function test_sales_staff_cannot_generate_agreement(): void
    {
        $case     = $this->makeCase();
        $template = $this->makeTemplate();

        $this->actingAs(User::factory()->create(['role' => 'sales']))
            ->postJson("/portal/immigration/cases/{$case->id}/agreements", [
                'agreement_template_id' => $template->id,
            ])
            ->assertForbidden();
    }

    public function test_cannot_generate_for_non_case_lead(): void
    {
        $lead = Lead::create([
            'first_name'          => 'Plain',
            'last_name'           => 'Lead',
            'email'               => 'plain@example.test',
            'is_immigration_case' => false,
        ]);
        $template = $this->makeTemplate();

        $this->actingAs(User::factory()->create(['role' => 'immigration']))
            ->postJson("/portal/immigration/cases/{$lead->id}/agreements", [
                'agreement_template_id' => $template->id,
            ])
            ->assertNotFound();
    }

    public function test_voiding_agreement_changes_status_to_voided(): void
    {
        $case     = $this->makeCase();
        $template = $this->makeTemplate();
        $user     = User::factory()->create(['role' => 'immigration']);

        $agreement = Agreement::create([
            'lead_id'               => $case->id,
            'agreement_template_id' => $template->id,
            'generated_by_user_id'  => $user->id,
            'title'                 => 'Test',
            'content_rendered'      => 'body',
            'status'                => 'draft',
        ]);

        $this->actingAs($user)
            ->postJson("/portal/immigration/cases/{$case->id}/agreements/{$agreement->id}/void", [
                'reason' => 'Client requested changes',
            ])
            ->assertOk()
            ->assertJsonPath('agreement.status', 'voided');
    }

    public function test_cross_case_agreement_id_returns_404(): void
    {
        $caseA    = $this->makeCase();
        $caseB    = $this->makeCase(['email' => 'b@example.test']);
        $template = $this->makeTemplate();

        $a = Agreement::create([
            'lead_id'               => $caseA->id,
            'agreement_template_id' => $template->id,
            'generated_by_user_id'  => User::factory()->create(['role' => 'immigration'])->id,
            'title'                 => 'A',
            'content_rendered'      => 'body',
            'status'                => 'draft',
        ]);

        $this->actingAs(User::factory()->create(['role' => 'immigration']))
            ->postJson("/portal/immigration/cases/{$caseB->id}/agreements/{$a->id}/void", [
                'reason' => 'mismatch',
            ])
            ->assertNotFound();
    }
}
