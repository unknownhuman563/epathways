<?php

namespace Tests\Feature\Immigration;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A free assessment can be exported in the official Visa Information Form
 * format (PDF / Word / HTML preview), same as the visa-intake assessments.
 */
class FreeAssessmentExportTest extends TestCase
{
    use RefreshDatabase;

    private function lead(): Lead
    {
        return Lead::create([
            'lead_id' => 'LP-55001', 'first_name' => 'Halfway', 'last_name' => 'Drafter',
            'email' => 'draft@example.com', 'phone' => '+63 9172223333',
        ]);
    }

    public function test_free_assessment_html_preview_renders_with_applicant(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'immigration']));
        $lead = $this->lead();

        $res = $this->get("/portal/immigration/intakes/free/{$lead->id}/preview");
        $res->assertOk();
        $res->assertSee('Halfway Drafter');
    }

    public function test_free_assessment_word_downloads(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'immigration']));
        $lead = $this->lead();

        $res = $this->get("/portal/immigration/intakes/free/{$lead->id}/word");
        $res->assertOk();
        $res->assertHeader('content-type', 'application/msword; charset=utf-8');
        $this->assertStringContainsString('.doc', (string) $res->headers->get('content-disposition'));
    }
}
