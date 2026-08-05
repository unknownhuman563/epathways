<?php

namespace Tests\Feature\Immigration;

use App\Models\CaseFinding;
use App\Models\CaseStepState;
use App\Models\Lead;
use App\Models\User;
use App\Services\Immigration\CaseFindingService;
use App\Services\Immigration\CaseStepService;
use Database\Seeders\CaseStepTemplateSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Build 12 phase 4.5 — the process-chain engine. Covers the four behaviours
 * called out for this phase: re-entry attempts, parallelism vs gating,
 * not_applicable inertness, and (via the clock test) business-time SLAs.
 */
class ProcessChainTest extends TestCase
{
    use RefreshDatabase;

    private CaseStepService $svc;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        (new CaseStepTemplateSeeder)->run();
        $this->svc = app(CaseStepService::class);
        $this->user = User::factory()->create(['role' => 'immigration']);
        $this->actingAs($this->user);
    }

    private function caseLead(string $visa = 'Student Visa'): Lead
    {
        return Lead::create([
            'first_name' => 'Aroha', 'last_name' => 'Ngata', 'email' => 'aroha@example.test',
            'is_immigration_case' => true, 'inz_visa_type' => $visa,
        ]);
    }

    private function statusOf(Lead $lead, string $key): string
    {
        return $this->svc->currentStates($lead)->get($key)->status;
    }

    // ── Parallelism (11) vs gating (12) ─────────────────────────────────────

    public function test_payment_runs_parallel_to_docs_but_gates_lodgement(): void
    {
        $lead = $this->caseLead();
        $this->svc->instantiate($lead);

        foreach (['01', '02', '03', '04', '05', '06', '07'] as $k) {
            $this->svc->complete($lead, $k, $this->user);
        }

        // After 07: docs (09) and payment (11) both open — 11 does NOT wait on
        // the doc steps. The QC step 10 waits on 09; lodgement 12 waits on both.
        $this->assertSame('active', $this->statusOf($lead, '09'));
        $this->assertSame('active', $this->statusOf($lead, '11'));
        $this->assertSame('pending', $this->statusOf($lead, '10'));
        $this->assertSame('pending', $this->statusOf($lead, '12'));

        $this->svc->complete($lead, '09', $this->user);
        $this->svc->complete($lead, '10', $this->user);

        // 10 done but 11 not → 12 still blocked. Payment gates lodgement.
        $this->assertSame('pending', $this->statusOf($lead, '12'));

        $this->svc->complete($lead, '11', $this->user);
        $this->assertSame('active', $this->statusOf($lead, '12'));
    }

    // ── not_applicable is inert ─────────────────────────────────────────────

    public function test_not_applicable_step_blocks_nothing_and_makes_no_findings(): void
    {
        // Non-partner visa → the partner fork (06a) is not_applicable.
        $lead = $this->caseLead('Student Visa');
        $this->svc->instantiate($lead);

        $this->assertSame('not_applicable', $this->statusOf($lead, '06a'));

        // 06 depends on 05 AND 06a — the not_applicable fork must not block it.
        foreach (['01', '02', '03', '04', '05'] as $k) {
            $this->svc->complete($lead, $k, $this->user);
        }
        $this->assertSame('active', $this->statusOf($lead, '06'));

        // And a not_applicable step never produces a finding.
        app(CaseFindingService::class)->evaluate($lead);
        $this->assertSame(0, CaseFinding::where('lead_id', $lead->id)
            ->where('finding_key', 'like', '%06a%')->count());
    }

    // ── RFI re-entry: fresh due_at, no finding collision ────────────────────

    public function test_rfi_reattempt_gets_fresh_due_at_and_does_not_collide(): void
    {
        $lead = $this->caseLead();
        $this->svc->instantiate($lead);

        // Put step 12 (48h SLA) into an active, overdue attempt-1 state.
        $s12 = CaseStepState::where('lead_id', $lead->id)->where('step_key', '12')->firstOrFail();
        $s12->forceFill([
            'status' => 'active', 'attempt' => 1,
            'activated_at' => now()->subDays(5), 'due_at' => now()->subDays(3),
        ])->save();

        app(CaseFindingService::class)->evaluate($lead);
        $this->assertDatabaseHas('case_findings', ['finding_key' => 'overdue_step:12:1', 'status' => 'open']);

        // Complete attempt 1 → its overdue finding auto-resolves.
        $this->svc->complete($lead, '12', $this->user);
        app(CaseFindingService::class)->evaluate($lead);
        $this->assertSame('actioned', CaseFinding::where('finding_key', 'overdue_step:12:1')->firstOrFail()->status);

        // RFI re-enters step 12 as a new attempt with a FRESH (future) due_at.
        $att2 = $this->svc->reactivate($lead, '12', 'rfi', 'INZ requested more info');
        $this->assertSame(2, $att2->attempt);
        $this->assertTrue($att2->due_at->isFuture(), 'RFI re-attempt must get a fresh, future due_at');

        // Force the new attempt overdue → a DISTINCT finding, and attempt 1's
        // resolved finding is not reopened (no collision on the key).
        $att2->forceFill(['due_at' => now()->subDay()])->save();
        app(CaseFindingService::class)->evaluate($lead);

        $this->assertDatabaseHas('case_findings', ['finding_key' => 'overdue_step:12:2', 'status' => 'open']);
        $this->assertSame('actioned', CaseFinding::where('finding_key', 'overdue_step:12:1')->firstOrFail()->status);
    }

    // ── A: weekly Friday-update cadence ──────────────────────────────────────

    public function test_friday_update_cadence_fires_after_lodgement_and_resolves_when_logged(): void
    {
        $lead = $this->caseLead();
        $this->svc->instantiate($lead);

        // Pre-lodgement: the cadence rule stays silent.
        app(CaseFindingService::class)->evaluate($lead);
        $this->assertDatabaseMissing('case_findings', ['lead_id' => $lead->id, 'finding_key' => 'friday_update_overdue', 'status' => 'open']);

        // Lodged, and no Friday update logged yet → the cadence fires.
        CaseStepState::where('lead_id', $lead->id)->where('step_key', '13')
            ->update(['status' => 'done', 'completed_at' => now()->subDays(10)]);
        app(CaseFindingService::class)->evaluate($lead);
        $this->assertDatabaseHas('case_findings', ['lead_id' => $lead->id, 'finding_key' => 'friday_update_overdue', 'status' => 'open']);

        // Log a Friday update (a completed step-14 attempt) → it resolves.
        CaseStepState::where('lead_id', $lead->id)->where('step_key', '14')
            ->update(['status' => 'done', 'completed_at' => now()]);
        app(CaseFindingService::class)->evaluate($lead);
        $this->assertSame('actioned', CaseFinding::where('lead_id', $lead->id)->where('finding_key', 'friday_update_overdue')->firstOrFail()->status);
    }

    // ── B: adviser owner resolution is explicit, never arbitrary ────────────

    public function test_adviser_resolver_is_null_when_ambiguous_and_default_when_configured(): void
    {
        \Illuminate\Support\Facades\Notification::fake();

        // Two current-licensed users — a full LIA and a provisional adviser.
        $hendry = User::factory()->create(['iaa_licence_number' => 'IAA-FULL', 'iaa_licence_type' => 'Full', 'iaa_licence_expiry' => now()->addYear()]);
        User::factory()->create(['iaa_licence_number' => 'IAA-PROV', 'iaa_licence_type' => 'Provisional', 'iaa_licence_expiry' => now()->addYear()]);

        $lead = $this->caseLead();
        $this->svc->instantiate($lead);

        // Ambiguous + no default → unassigned, NOT an arbitrary pick.
        $state = $this->svc->reactivate($lead, '06', 'manual');
        $this->assertNull($state->owner_user_id);

        // Configured default → deterministic.
        config(['immigration.step_owners.adviser' => $hendry->id]);
        $state2 = $this->svc->reactivate($lead, '06', 'manual');
        $this->assertSame($hendry->id, $state2->owner_user_id);
    }
}
