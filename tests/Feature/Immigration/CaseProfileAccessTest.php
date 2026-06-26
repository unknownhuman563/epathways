<?php

namespace Tests\Feature\Immigration;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Build 11.D Phase 1 — Case Profile access gate.
 *
 * Mirrors the policy at app/Http/Controllers/Api/AiCaseAnalysisController.php
 * (Build 10): only admin/super-admin + immigration roles may view a case
 * profile. Sales/education/english/accommodation are denied.
 */
class CaseProfileAccessTest extends TestCase
{
    use RefreshDatabase;

    private function makeCase(array $attrs = []): Lead
    {
        return Lead::create(array_merge([
            'first_name'          => 'Visa',
            'last_name'           => 'Applicant',
            'email'               => 'visa.applicant@example.test',
            'is_immigration_case' => true,
            'inz_visa_type'       => 'Skilled Migrant Category',
        ], $attrs));
    }

    private function url(Lead $case): string
    {
        return "/portal/immigration/cases/{$case->id}/profile";
    }

    public function test_consultant_can_view_case_profile(): void
    {
        $case = $this->makeCase();
        $consultant = User::factory()->create(['role' => 'immigration']);

        $this->actingAs($consultant)
            ->get($this->url($case))
            ->assertOk();
    }

    public function test_sales_staff_cannot_view_case_profile(): void
    {
        $case = $this->makeCase();
        $sales = User::factory()->create(['role' => 'sales']);

        $this->actingAs($sales)
            ->get($this->url($case))
            ->assertForbidden();
    }

    public function test_education_admin_cannot_view_case_profile(): void
    {
        $case = $this->makeCase();
        $education = User::factory()->create(['role' => 'education']);

        $this->actingAs($education)
            ->get($this->url($case))
            ->assertForbidden();
    }

    public function test_english_teacher_cannot_view_case_profile(): void
    {
        $case = $this->makeCase();
        $english = User::factory()->create(['role' => 'english']);

        $this->actingAs($english)
            ->get($this->url($case))
            ->assertForbidden();
    }

    public function test_admin_can_view_any_case_profile(): void
    {
        $case = $this->makeCase();
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get($this->url($case))
            ->assertOk();
    }

    public function test_immigration_manager_and_adviser_can_view(): void
    {
        $case = $this->makeCase();

        $this->actingAs(User::factory()->create(['role' => 'immigration_manager']))
            ->get($this->url($case))->assertOk();

        $this->actingAs(User::factory()->create(['role' => 'immigration_adviser']))
            ->get($this->url($case))->assertOk();
    }

    public function test_non_case_lead_returns_404(): void
    {
        // is_immigration_case = false → case profile is not the right surface.
        // Non-cases continue to use LeadController::show via /admin/leads/{id}.
        $lead = Lead::create([
            'first_name'          => 'Plain',
            'last_name'           => 'Lead',
            'email'               => 'plain.lead@example.test',
            'is_immigration_case' => false,
        ]);
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get($this->url($lead))
            ->assertNotFound();
    }

    public function test_unauthenticated_user_redirected_to_login(): void
    {
        $case = $this->makeCase();

        $this->get($this->url($case))
            ->assertRedirect('/login');
    }
}
