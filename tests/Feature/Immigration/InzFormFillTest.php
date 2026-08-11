<?php

namespace Tests\Feature\Immigration;

use App\Models\InzForm;
use App\Models\InzFormVersion;
use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\User;
use App\Services\Immigration\InzCaseContext;
use App\Services\Immigration\InzFormFiller;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * INZ form fill pipeline. The byte-level fill is isolated behind InzFormFiller,
 * so these verify the pieces that don't need a real PDF: context building, the
 * field map resolving pdf_field → case value, and generate() producing a DRAFT
 * LeadDocument that records the exact version filled against.
 */
class InzFormFillTest extends TestCase
{
    use RefreshDatabase;

    private function caseLead(): Lead
    {
        return Lead::create([
            'first_name' => 'Aroha', 'last_name' => 'Ngata', 'email' => 'aroha@example.test',
            'phone' => '+64 21 555 0101', 'passport_number' => 'P1234567',
            'is_immigration_case' => true, 'inz_visa_type' => 'Student Visa',
        ]);
    }

    private function staff(): User
    {
        return User::factory()->create(['role' => 'immigration']);
    }

    /** Bind a fake filler so no real PDF is needed. */
    private function fakeFiller(): void
    {
        $this->app->instance(InzFormFiller::class, new class extends InzFormFiller
        {
            public function supported(): bool
            {
                return true;
            }

            public function fill(InzFormVersion $version, array $context): string
            {
                return '%PDF-1.4 fake '.($context['applicant.family_name'] ?? '');
            }
        });
    }

    public function test_context_builds_stable_keys_from_the_case(): void
    {
        $ctx = InzCaseContext::for($this->caseLead());
        $this->assertSame('Ngata', $ctx['applicant.family_name']);
        $this->assertSame('Aroha', $ctx['applicant.first_name']);
        $this->assertSame('P1234567', $ctx['applicant.passport_number']);
        $this->assertSame('ePathways', $ctx['firm.name']);
        // A blank field stays blank — never guessed.
        $this->assertSame('', $ctx['applicant.residence_country']);
    }

    public function test_field_map_resolves_pdf_fields_from_context(): void
    {
        $version = new InzFormVersion(['field_map' => [
            ['pdf_field' => 'Family_last_name', 'source' => 'applicant.family_name'],
            ['pdf_field' => 'Given_names', 'source' => 'applicant.first_name'],
            ['pdf_field' => 'Firm', 'literal' => 'ePathways'],
            ['pdf_field' => 'Missing', 'source' => 'applicant.nonexistent'], // → ''
        ]]);

        $values = (new InzFormFiller)->fieldValues($version, InzCaseContext::for($this->caseLead()));

        $this->assertSame('Ngata', $values['Family_last_name']);
        $this->assertSame('Aroha', $values['Given_names']);
        $this->assertSame('ePathways', $values['Firm']);
        $this->assertSame('', $values['Missing']);
    }

    public function test_generate_creates_a_draft_document_recording_the_version(): void
    {
        Storage::fake('local');
        $this->fakeFiller();

        $form = InzForm::create(['code' => 'INZ1012', 'name' => 'Student Visa Application', 'category' => 'Student']);
        $version = $form->versions()->create([
            'version_label' => 'Nov 2025', 'file_path' => 'inz-forms/INZ1012/nov-2025.pdf',
            'is_acroform' => true, 'is_current' => true,
        ]);
        $case = $this->caseLead();

        $this->actingAs($this->staff())
            ->post("/portal/immigration/cases/{$case->id}/inz-forms/INZ1012/generate")
            ->assertRedirect();

        $doc = LeadDocument::where('lead_id', $case->id)->firstOrFail();
        $this->assertSame('generated', $doc->source);
        $this->assertSame('inz:INZ1012', $doc->source_variant);
        $this->assertSame($version->id, $doc->inz_form_version_id); // exact version recorded
        $this->assertStringContainsString('INZ1012', $doc->original_name);
        $this->assertStringContainsString('Nov 2025', $doc->original_name);
        Storage::disk('local')->assertExists($doc->file_path);
    }

    public function test_generate_is_blocked_when_no_official_pdf_uploaded(): void
    {
        Storage::fake('local');
        $this->fakeFiller();

        $form = InzForm::create(['code' => 'INZ1014', 'name' => 'Financial Undertaking for a Student', 'category' => 'Student']);
        $form->versions()->create(['version_label' => 'Jun 2025', 'is_current' => true]); // no file_path
        $case = $this->caseLead();

        $this->actingAs($this->staff())
            ->post("/portal/immigration/cases/{$case->id}/inz-forms/INZ1014/generate")
            ->assertRedirect();

        $this->assertSame(0, LeadDocument::where('lead_id', $case->id)->count());
    }
}
