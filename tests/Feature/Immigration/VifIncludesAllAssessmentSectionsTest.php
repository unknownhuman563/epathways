<?php

namespace Tests\Feature\Immigration;

use App\Http\Controllers\Portal\ImmigrationController;
use App\Models\Lead;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The VIF must be built from the client's OWN assessment sections, so every
 * section they filled appears — previously the rigid A–K format dropped
 * visa-specific sections (Study Plan, Travel Plan, Family, …).
 */
class VifIncludesAllAssessmentSectionsTest extends TestCase
{
    use RefreshDatabase;

    private function builder(): ImmigrationController
    {
        return app(ImmigrationController::class);
    }

    private function rowFor(array $sections, string $title, string $questionContains): ?array
    {
        $section = collect($sections)->firstWhere('title', $title);
        if (! $section) {
            return null;
        }

        return collect($section['rows'])->first(fn ($r) => isset($r['q']) && str_contains($r['q'], $questionContains));
    }

    public function test_student_vif_includes_study_plan_and_funds(): void
    {
        $sections = $this->builder()->buildVifSections('student', [
            'first_name' => 'Katherine', 'family_name' => 'Paspe',
            'programmes' => 'Diploma in IT', 'school_name' => 'AUT', 'has_offer' => 'Yes',
            'tuition_fee_nzd' => 24000, 'has_sponsor' => 'Yes',
        ]);

        $this->assertNotNull(collect($sections)->firstWhere('title', 'Study Plan'), 'Study Plan section present');
        $prog = $this->rowFor($sections, 'Study Plan', 'Programme');
        $this->assertSame('Diploma in IT', $prog['a']);

        $this->assertNotNull(collect($sections)->firstWhere('title', 'Study Funds & Assets'));
    }

    public function test_visitor_vif_includes_travel_plan(): void
    {
        $sections = $this->builder()->buildVifSections('visitor', [
            'first_name' => 'Ana', 'family_name' => 'Cruz',
            'purpose_of_visit' => 'Tourism', 'intended_stay_length' => 'More than 6 months',
        ]);

        $purpose = $this->rowFor($sections, 'Travel Plan', 'Purpose of Visit');
        $this->assertSame('Tourism', $purpose['a']);
    }

    public function test_declaration_section_renders_as_a_bare_statement(): void
    {
        $sections = $this->builder()->buildVifSections('work', [
            'first_name' => 'Bob', 'declaration_accepted' => true, 'signature_name' => 'Bob',
        ]);

        $decl = collect($sections)->firstWhere('title', 'Declaration');
        $this->assertNotNull($decl);
        $this->assertTrue($decl['bare']);
        // The accepted declaration is a ticked statement row, not a Q/A row.
        $check = collect($decl['rows'])->first(fn ($r) => ($r['t'] ?? null) === 'check');
        $this->assertNotNull($check);
        $this->assertTrue($check['on']);
    }

    public function test_free_assessment_vif_builds_sections(): void
    {
        $lead = Lead::create([
            'first_name' => 'Free', 'last_name' => 'Client', 'email' => 'f@example.com',
            'dob' => '1990-01-01', 'citizenship' => 'India', 'source' => 'free-assessment',
        ]);

        $sections = $this->builder()->freeVifSections($lead);
        $this->assertNotEmpty($sections);
        // Every section carries a title and rows in the VIF (Blade) shape.
        $this->assertArrayHasKey('title', $sections[0]);
        $this->assertArrayHasKey('rows', $sections[0]);
    }
}
