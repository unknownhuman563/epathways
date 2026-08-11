<?php

namespace Tests\Feature\Immigration;

use App\Models\CaseFinding;
use App\Models\Lead;
use App\Models\User;
use App\Models\VisaType;
use App\Services\Immigration\CaseFindingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Build 12 phase 3 refinement — the panel collapses repeated same-rule findings
 * (e.g. many checklist items) into one summary row with a single dismiss. The
 * collapse is presentation-only: server-side, dismissal stays PER ITEM and
 * evidence-scoped, so dedup, auto-resolve and evidence-scoped re-open all keep
 * working exactly as they do for a single finding.
 */
class FindingGroupDismissTest extends TestCase
{
    use RefreshDatabase;

    private function studentVisaWithFourItems(): VisaType
    {
        return VisaType::create([
            'code' => 'student_visa', 'name' => 'Student Visa', 'category' => 'Student',
            'consultation_price_nzd' => 250, 'active' => true,
            'checklist_items' => [
                ['key' => 'police_cert', 'label' => 'Police certificate', 'required' => true],
                ['key' => 'transcript', 'label' => 'Academic transcript', 'required' => true],
                ['key' => 'passport_bio', 'label' => 'Passport bio page', 'required' => true],
                ['key' => 'bank_statement', 'label' => 'Bank statement', 'required' => true],
            ],
        ]);
    }

    private function caseLead(): Lead
    {
        return Lead::create([
            'first_name' => 'Aroha', 'last_name' => 'Ngata', 'email' => 'aroha@example.test',
            'is_immigration_case' => true, 'inz_visa_type' => 'Student Visa',
        ]);
    }

    private function staff(): User
    {
        return User::factory()->create(['role' => 'immigration']);
    }

    public function test_group_dismiss_dismisses_every_item_evidence_scoped_and_leaves_others(): void
    {
        $this->studentVisaWithFourItems();
        $case = $this->caseLead();
        app(CaseFindingService::class)->evaluate($case);

        $checklist = CaseFinding::where('lead_id', $case->id)
            ->where('finding_key', 'like', 'checklist_missing:%')->get();
        $this->assertGreaterThanOrEqual(3, $checklist->count(), 'need enough items to collapse');

        // A finding from a DIFFERENT rule must survive a checklist group-dismiss.
        $sentinel = CaseFinding::create([
            'lead_id' => $case->id, 'finding_key' => 'passport_expiring',
            'category' => 'Personal', 'severity' => 'check', 'title' => 'Passport expiring',
            'source' => 'rule', 'audience' => 'staff', 'status' => 'open',
            'first_seen_at' => now(), 'last_seen_at' => now(),
        ]);

        $staff = $this->staff();
        $this->actingAs($staff)
            ->post("/portal/immigration/cases/{$case->id}/findings/group-dismiss", [
                'prefix' => 'checklist_missing', 'reason' => 'Client only just engaged — collecting now',
            ])
            ->assertRedirect();

        // Every checklist item is dismissed, each with its OWN evidence
        // fingerprint (not one blanket dismissal) and the reason + actor recorded.
        foreach ($checklist as $f) {
            $fresh = $f->fresh();
            $this->assertSame('dismissed', $fresh->status);
            $this->assertNotNull($fresh->dismissed_fingerprint, 'per-item fingerprint must be set');
            $this->assertSame('Client only just engaged — collecting now', $fresh->dismiss_reason);
            $this->assertSame($staff->id, $fresh->actioned_by);
        }
        // The unrelated finding is untouched.
        $this->assertSame('open', $sentinel->fresh()->status);
    }

    public function test_dismissed_items_stay_dismissed_on_re_evaluation(): void
    {
        $this->studentVisaWithFourItems();
        $case = $this->caseLead();
        app(CaseFindingService::class)->evaluate($case);

        $this->actingAs($this->staff())
            ->post("/portal/immigration/cases/{$case->id}/findings/group-dismiss", [
                'prefix' => 'checklist_missing', 'reason' => 'Collecting now',
            ])
            ->assertRedirect();

        // Re-running the rules must NOT re-open them — the per-item evidence-scoped
        // dismissal still governs (same stable evidence → dismissal holds).
        app(CaseFindingService::class)->evaluate($case);

        $stillDismissed = CaseFinding::where('lead_id', $case->id)
            ->where('finding_key', 'like', 'checklist_missing:%')
            ->where('status', 'dismissed')->count();
        $open = CaseFinding::where('lead_id', $case->id)
            ->where('finding_key', 'like', 'checklist_missing:%')
            ->where('status', 'open')->count();

        $this->assertGreaterThanOrEqual(3, $stillDismissed);
        $this->assertSame(0, $open, 'evidence-scoped dismissal must survive re-evaluation');
    }

    public function test_only_groupable_rules_can_be_group_dismissed(): void
    {
        $case = $this->caseLead();
        // A single-firing rule is not a group and must not be a mass-dismiss lever.
        $this->actingAs($this->staff())
            ->post("/portal/immigration/cases/{$case->id}/findings/group-dismiss", [
                'prefix' => 'invoice_overdue', 'reason' => 'x',
            ])
            ->assertStatus(422);
    }

    public function test_group_dismiss_requires_a_reason(): void
    {
        $case = $this->caseLead();
        $this->actingAs($this->staff())
            ->post("/portal/immigration/cases/{$case->id}/findings/group-dismiss", [
                'prefix' => 'checklist_missing',
            ])
            ->assertSessionHasErrors('reason');
    }
}
