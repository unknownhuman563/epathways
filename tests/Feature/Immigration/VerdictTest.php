<?php

namespace Tests\Feature\Immigration;

use App\Exceptions\LodgementSignoffRequiredException;
use App\Models\CaseAttestation;
use App\Models\CaseFinding;
use App\Models\CaseStepState;
use App\Models\Lead;
use App\Models\User;
use App\Services\Immigration\CaseFindingService;
use App\Services\Immigration\CaseStepService;
use App\Services\Immigration\VerdictService;
use Database\Seeders\CaseStepTemplateSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Build 12 phase 5 — verdict + lodgement sign-off. Every case_attestations row
 * passes the licence gate; the case's movement derives from the attestation.
 */
class VerdictTest extends TestCase
{
    use RefreshDatabase;

    private CaseStepService $steps;

    private VerdictService $verdicts;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
        (new CaseStepTemplateSeeder)->run();
        $this->steps = app(CaseStepService::class);
        $this->verdicts = app(VerdictService::class);
    }

    private function caseLead(string $visa = 'Student Visa'): Lead
    {
        return Lead::create([
            'first_name' => 'Aroha', 'last_name' => 'Ngata', 'email' => 'aroha@example.test',
            'is_immigration_case' => true, 'inz_visa_type' => $visa,
        ]);
    }

    private function adviser(bool $current = true): User
    {
        return User::factory()->create([
            'role' => 'immigration_adviser',
            'iaa_licence_number' => 'IAA-9',
            'iaa_licence_expiry' => $current ? now()->addYear() : now()->subDay(),
        ]);
    }

    // ── The licence gate ─────────────────────────────────────────────────────

    public function test_unlicensed_user_cannot_write_an_attestation(): void
    {
        $case = $this->caseLead();
        $unlicensed = User::factory()->create(['role' => 'immigration']);

        $this->actingAs($unlicensed)
            ->post("/portal/immigration/cases/{$case->id}/verdict", ['verdict' => 'good_to_go'])
            ->assertForbidden();

        $this->assertDatabaseCount('case_attestations', 0);
    }

    public function test_lapsed_licence_cannot_write_an_attestation(): void
    {
        $case = $this->caseLead();
        $lapsed = $this->adviser(current: false);

        $this->actingAs($lapsed)
            ->post("/portal/immigration/cases/{$case->id}/verdict", ['verdict' => 'good_to_go'])
            ->assertForbidden();

        $this->assertDatabaseCount('case_attestations', 0);
        // Defense-in-depth: the service refuses too.
        $this->expectException(\App\Exceptions\AdviceGateException::class);
        $this->verdicts->recordVerdict($case, 'good_to_go', null, $lapsed);
    }

    // ── §6 behaviour ─────────────────────────────────────────────────────────

    public function test_needs_something_reopens_the_step_with_a_fresh_due_at(): void
    {
        $case = $this->caseLead();
        $this->steps->instantiate($case);
        $adviser = $this->adviser();

        // Bounce back to step 02 (which carries a 48h SLA).
        $this->verdicts->recordVerdict($case, 'needs_something', 'Form is incomplete', $adviser, '02');

        $latest = CaseStepState::where('lead_id', $case->id)->where('step_key', '02')->orderByDesc('attempt')->firstOrFail();
        $this->assertSame(2, $latest->attempt);
        $this->assertSame('verdict_needs_something', $latest->reactivation_trigger);
        $this->assertNotNull($latest->due_at);
        $this->assertTrue($latest->due_at->isFuture(), 'the re-attempt must get a fresh, future due_at');
    }

    // ── Lodgement gate ───────────────────────────────────────────────────────

    public function test_step_12_will_not_complete_on_upload_alone(): void
    {
        $case = $this->caseLead();
        $this->steps->instantiate($case);
        $staff = User::factory()->create(['role' => 'immigration']);

        // The mechanical "complete" path is refused without a sign-off.
        $this->expectException(LodgementSignoffRequiredException::class);
        $this->steps->complete($case, '12', $staff);
    }

    public function test_lodgement_signoff_completes_step_12(): void
    {
        $case = $this->caseLead();
        $this->steps->instantiate($case);
        $adviser = $this->adviser();

        $this->verdicts->recordLodgementSignoff($case, $adviser, 'Reviewed and ready to lodge');

        $this->assertTrue(CaseAttestation::hasLodgementSignoff($case->id));
        $s12 = CaseStepState::where('lead_id', $case->id)->where('step_key', '12')->orderByDesc('attempt')->firstOrFail();
        $this->assertSame('done', $s12->status);
    }

    // ── Dismissed findings re-surface at the lodgement gate ─────────────────

    public function test_finding_dismissed_earlier_reopens_at_the_lodgement_gate(): void
    {
        // A visa with a checklist so a checklist-missing finding exists.
        \App\Models\VisaType::create([
            'code' => 'student_visa', 'name' => 'Student Visa', 'category' => 'Student',
            'consultation_price_nzd' => 250, 'active' => true,
            'checklist_items' => [['key' => 'police_cert', 'label' => 'Police certificate', 'required' => true]],
        ]);
        $case = $this->caseLead();
        $this->steps->instantiate($case);
        $this->actingAs(User::factory()->create(['role' => 'immigration']));

        // A finding is raised at step 09-ish and dismissed as a convenience.
        app(CaseFindingService::class)->evaluate($case);
        $finding = CaseFinding::where('lead_id', $case->id)->where('finding_key', 'checklist_missing:police_cert')->firstOrFail();
        $finding->update(['status' => 'dismissed', 'dismiss_reason' => 'Client emailed a copy', 'dismissed_fingerprint' => 'x']);

        // The case reaches the lodgement gate (step 12 activates).
        CaseStepState::where('lead_id', $case->id)->whereIn('step_key', ['10', '11'])
            ->update(['status' => 'done', 'completed_at' => now()]);
        $this->steps->advance($case);

        $this->assertSame('active', CaseStepState::where('lead_id', $case->id)->where('step_key', '12')->value('status'));
        // The convenience-dismissal is reopened so it can't ride through to submission.
        $this->assertSame('open', $finding->fresh()->status);
    }
}
