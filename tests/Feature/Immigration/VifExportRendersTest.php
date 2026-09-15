<?php

namespace Tests\Feature\Immigration;

use App\Models\Lead;
use App\Models\User;
use App\Models\VisitorIntake;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The VIF preview / Word / PDF exports must render (not 500). Regression for
 * the Blade choking on Q/A rows that don't carry a 't' type — which 500'd the
 * free-assessment and intake VIF downloads.
 */
class VifExportRendersTest extends TestCase
{
    use RefreshDatabase;

    private function staff(): User
    {
        return User::factory()->create(['role' => 'immigration']);
    }

    public function test_free_assessment_vif_preview_renders(): void
    {
        $lead = Lead::create([
            'first_name' => 'Sheery', 'last_name' => 'Serra', 'email' => 's@example.com',
            'dob' => '1998-05-05', 'citizenship' => 'Philippines', 'source' => 'free-assessment',
        ]);

        // The web preview shares the exact render path as PDF/Word (pdf.intake).
        $this->actingAs($this->staff())
            ->get("/portal/immigration/intakes/free/{$lead->id}/preview")
            ->assertOk()
            ->assertSee('Visa Information Form', false);
    }

    public function test_intake_vif_preview_renders(): void
    {
        $intake = VisitorIntake::create([
            'intake_id' => 'VI-VIF', 'status' => 'Submitted',
            'first_name' => 'Ana', 'family_name' => 'Cruz', 'email' => 'a@example.com',
            'dob' => '1992-04-11', 'phone' => '+64 21 000 0000',
            'purpose_of_visit' => 'Tourism',
        ]);

        $this->actingAs($this->staff())
            ->get("/portal/immigration/intakes/visitor/{$intake->id}/preview")
            ->assertOk()
            ->assertSee('Travel Plan', false);
    }
}
