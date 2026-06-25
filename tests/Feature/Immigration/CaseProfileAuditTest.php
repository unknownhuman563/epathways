<?php

namespace Tests\Feature\Immigration;

use App\Models\CaseAuditView;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Build 11.D Phase 1 — Privacy Act 2020 audit-trail compliance.
 *
 * The audit (docs/audits/VISA_ASSESSMENT_CASE_DETAIL_AUDIT_2026-06-22.md
 * Section 11 surprise #7) flagged that intake detail views leave no audit
 * trail. The Case Profile MUST write a CaseAuditView row on every render
 * with context 'case_profile' so this surface stays distinguishable from
 * the legacy lead-detail view (context 'lead detail').
 */
class CaseProfileAuditTest extends TestCase
{
    use RefreshDatabase;

    private function makeCase(): Lead
    {
        return Lead::create([
            'first_name'          => 'Visa',
            'last_name'           => 'Applicant',
            'email'               => 'visa.applicant@example.test',
            'is_immigration_case' => true,
        ]);
    }

    public function test_viewing_case_profile_writes_to_case_audit_views(): void
    {
        $case = $this->makeCase();
        $user = User::factory()->create(['role' => 'immigration']);

        $this->assertDatabaseCount('case_audit_views', 0);

        $this->actingAs($user)
            ->get("/portal/immigration/cases/{$case->id}/profile")
            ->assertOk();

        $this->assertDatabaseCount('case_audit_views', 1);
        $this->assertDatabaseHas('case_audit_views', [
            'lead_id'   => $case->id,
            'viewer_id' => $user->id,
            'action'    => 'view',
        ]);
    }

    public function test_audit_view_records_user_and_timestamp(): void
    {
        $case = $this->makeCase();
        $user = User::factory()->create(['role' => 'immigration', 'name' => 'Adviser Anna']);

        $this->actingAs($user)
            ->get("/portal/immigration/cases/{$case->id}/profile")
            ->assertOk();

        $row = CaseAuditView::first();
        $this->assertNotNull($row);
        $this->assertSame($user->id, $row->viewer_id);
        $this->assertSame('Adviser Anna', $row->viewer_name);
        $this->assertSame('immigration', $row->viewer_role);
        $this->assertNotNull($row->viewed_at);
    }

    public function test_audit_view_records_context_as_case_profile(): void
    {
        $case = $this->makeCase();
        $user = User::factory()->create(['role' => 'immigration']);

        $this->actingAs($user)
            ->get("/portal/immigration/cases/{$case->id}/profile")
            ->assertOk();

        $row = CaseAuditView::first();
        $this->assertSame('case_profile', $row->context);
    }

    public function test_each_view_writes_a_separate_audit_row(): void
    {
        $case = $this->makeCase();
        $user = User::factory()->create(['role' => 'immigration']);

        $this->actingAs($user)->get("/portal/immigration/cases/{$case->id}/profile");
        $this->actingAs($user)->get("/portal/immigration/cases/{$case->id}/profile");
        $this->actingAs($user)->get("/portal/immigration/cases/{$case->id}/profile");

        $this->assertDatabaseCount('case_audit_views', 3);
    }
}
