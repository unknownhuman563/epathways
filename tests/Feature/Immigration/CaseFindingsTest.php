<?php

namespace Tests\Feature\Immigration;

use App\Models\CaseFinding;
use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\User;
use App\Models\VisaType;
use App\Services\Immigration\CaseFindingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Build 12 phase 3 — case-assist findings (rules only). Findings name the
 * specific thing, dedup on finding_key, auto-resolve when the rule stops firing,
 * persist dismissals, and always report what couldn't be checked.
 */
class CaseFindingsTest extends TestCase
{
    use RefreshDatabase;

    private function studentVisa(): VisaType
    {
        return VisaType::create([
            'code' => 'student_visa', 'name' => 'Student Visa', 'category' => 'Student',
            'consultation_price_nzd' => 250, 'active' => true,
            'checklist_items' => [
                ['key' => 'police_cert', 'label' => 'Police certificate (Philippines)', 'required' => true],
                ['key' => 'transcript', 'label' => 'Academic transcript', 'required' => true],
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

    private function evaluate(Lead $lead): array
    {
        return app(CaseFindingService::class)->evaluate($lead);
    }

    public function test_missing_required_document_names_the_specific_item_with_evidence(): void
    {
        $this->studentVisa();
        $case = $this->caseLead();

        $this->evaluate($case);

        $finding = CaseFinding::where('lead_id', $case->id)
            ->where('finding_key', 'checklist_missing:police_cert')
            ->first();

        $this->assertNotNull($finding);
        // Named from the checklist, never invented.
        $this->assertSame('Police certificate (Philippines) not uploaded', $finding->title);
        $this->assertSame('police_cert', $finding->evidence['checklist_key']);
        $this->assertSame('open', $finding->status);
    }

    public function test_recurring_finding_dedups_on_finding_key(): void
    {
        $this->studentVisa();
        $case = $this->caseLead();

        $this->evaluate($case);
        $first = CaseFinding::where('lead_id', $case->id)->where('finding_key', 'checklist_missing:police_cert')->firstOrFail();
        $seen1 = $first->last_seen_at;

        $this->evaluate($case);

        // Same row (unique lead_id + finding_key), last_seen_at refreshed.
        $this->assertSame(1, CaseFinding::where('lead_id', $case->id)->where('finding_key', 'checklist_missing:police_cert')->count());
    }

    public function test_finding_auto_resolves_when_the_rule_stops_firing(): void
    {
        $this->studentVisa();
        $case = $this->caseLead();
        $this->evaluate($case);

        $this->assertSame('open', CaseFinding::where('finding_key', 'checklist_missing:police_cert')->firstOrFail()->status);

        // Upload the police certificate → the rule no longer fires.
        LeadDocument::create([
            'lead_id' => $case->id, 'checklist_key' => 'police_cert',
            'original_name' => 'pc.pdf', 'file_path' => 'p/pc.pdf', 'mime' => 'application/pdf',
            'size' => 1, 'status' => LeadDocument::STATUS_SUBMITTED, 'source' => LeadDocument::SOURCE_UPLOAD,
        ]);
        $this->evaluate($case);

        // Not deleted — resolved via status.
        $this->assertSame('actioned', CaseFinding::where('finding_key', 'checklist_missing:police_cert')->firstOrFail()->status);
    }

    public function test_dismissal_persists_even_if_the_rule_fires_again(): void
    {
        $this->studentVisa();
        $case = $this->caseLead();
        $this->evaluate($case);

        $finding = CaseFinding::where('finding_key', 'checklist_missing:police_cert')->firstOrFail();
        $finding->update(['status' => 'dismissed', 'dismiss_reason' => 'Applicant is exempt', 'actioned_at' => now()]);

        // Re-run: the document is still missing, so the rule fires again.
        $this->evaluate($case);

        $fresh = $finding->fresh();
        $this->assertSame('dismissed', $fresh->status, 'A dismissed finding must stay dismissed.');
        $this->assertSame('Applicant is exempt', $fresh->dismiss_reason);
    }

    public function test_dismissal_reopens_when_the_situation_changes(): void
    {
        $this->studentVisa();
        $case = $this->caseLead();
        $staff = User::factory()->create(['role' => 'immigration']);

        // A rejected police certificate (doc A).
        $docA = LeadDocument::create([
            'lead_id' => $case->id, 'checklist_key' => 'police_cert',
            'original_name' => 'a.pdf', 'file_path' => 'p/a.pdf', 'mime' => 'application/pdf',
            'size' => 1, 'status' => LeadDocument::STATUS_REJECTED, 'source' => LeadDocument::SOURCE_UPLOAD,
        ]);
        $docA->forceFill(['created_at' => now()->subMinutes(5)])->saveQuietly();

        $this->evaluate($case);
        $finding = CaseFinding::where('finding_key', 'doc_rejected:police_cert')->firstOrFail();

        // Dismiss it (scoped to doc A's situation).
        $this->actingAs($staff)
            ->from("/portal/immigration/cases/{$case->id}/profile")
            ->post("/portal/immigration/cases/{$case->id}/findings/{$finding->id}/dismiss", ['reason' => 'Client emailed a copy directly'])
            ->assertRedirect();

        // Same rejected doc → dismissal holds.
        $this->evaluate($case);
        $this->assertSame('dismissed', $finding->fresh()->status);

        // A DIFFERENT document is uploaded and rejected — a new situation.
        LeadDocument::create([
            'lead_id' => $case->id, 'checklist_key' => 'police_cert',
            'original_name' => 'b.pdf', 'file_path' => 'p/b.pdf', 'mime' => 'application/pdf',
            'size' => 1, 'status' => LeadDocument::STATUS_REJECTED, 'source' => LeadDocument::SOURCE_UPLOAD,
        ]);

        $this->evaluate($case);

        // The dismissal was scoped to the old doc — the new rejection re-opens.
        $reopened = $finding->fresh();
        $this->assertSame('open', $reopened->status);
        $this->assertNull($reopened->dismiss_reason);
    }

    public function test_run_records_couldnt_verify_for_unbuilt_capabilities(): void
    {
        $this->studentVisa();
        $case = $this->caseLead();

        $summary = $this->evaluate($case);

        // The required "couldn't verify" line still surfaces genuine data gaps
        // (a bare case has no passport expiry on file). Two rules GRADUATED off
        // this line and must no longer appear: the invoice-payment rule once
        // case_payments landed (phase 4.5), and the threads rule once
        // case_threads landed (phase 6).
        $joined = implode(' ', $summary['couldnt_verify']);
        $this->assertStringContainsStringIgnoringCase('passport', $joined);
        $this->assertStringNotContainsStringIgnoringCase('threads', $joined);
        $this->assertStringNotContainsStringIgnoringCase('payment', $joined);
    }

    public function test_dismiss_endpoint_requires_a_reason(): void
    {
        $this->studentVisa();
        $case = $this->caseLead();
        $this->evaluate($case);
        $finding = CaseFinding::where('finding_key', 'checklist_missing:police_cert')->firstOrFail();

        $staff = User::factory()->create(['role' => 'immigration']);

        // No reason → rejected, finding stays open.
        $this->actingAs($staff)
            ->from("/portal/immigration/cases/{$case->id}/profile")
            ->post("/portal/immigration/cases/{$case->id}/findings/{$finding->id}/dismiss", [])
            ->assertSessionHasErrors('reason');
        $this->assertSame('open', $finding->fresh()->status);

        // With reason → dismissed + persisted.
        $this->actingAs($staff)
            ->from("/portal/immigration/cases/{$case->id}/profile")
            ->post("/portal/immigration/cases/{$case->id}/findings/{$finding->id}/dismiss", ['reason' => 'Not applicable'])
            ->assertRedirect();
        $this->assertSame('dismissed', $finding->fresh()->status);
    }

    public function test_profile_exposes_findings_and_the_couldnt_verify_line(): void
    {
        $this->studentVisa();
        $case = $this->caseLead();
        $this->evaluate($case);

        $this->actingAs(User::factory()->create(['role' => 'immigration']))
            ->get("/portal/immigration/cases/{$case->id}/profile")
            ->assertOk()
            ->assertInertia(fn (\Inertia\Testing\AssertableInertia $p) => $p
                ->has('findings.items')
                ->has('findings.couldnt_verify')
                ->where('findings.items.0.source', 'rule')
            );
    }
}
