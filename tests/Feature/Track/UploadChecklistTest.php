<?php

namespace Tests\Feature\Track;

use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\User;
use App\Models\VisaType;
use Database\Seeders\VisaChecklistSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * End-to-end verification of the upload→checklist→approve loop on /track:
 *
 *   - the LeadTrackingController returns visa.checklist when the lead is
 *     an immigration case with an inz_visa_type that matches a VisaType row
 *   - it returns visa=null for non-immigration leads (so the modal falls
 *     back to its DOC_TYPES list)
 *   - it returns visa with an empty checklist (or no name match) when the
 *     immigration case has no visa_type set
 *   - uploading via /track/{code}/document persists the lead's chosen
 *     checklist_key verbatim
 *   - a fresh upload flips the matching Visa Requirements item from
 *     "missing" to "submitted"
 *   - a staff approval via /admin/leads/{id}/documents/{docId}/status
 *     flips it from "submitted" to "approved" on the same /track payload
 */
class UploadChecklistTest extends TestCase
{
    use RefreshDatabase;

    /** A minimal admin user used for the staff-approval call. */
    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    /**
     * Seed a complete Student Visa catalogue row + its checklist, exactly
     * as production would have after VisaTypeSeeder + VisaChecklistSeeder.
     */
    private function seedStudentVisa(): VisaType
    {
        VisaType::create([
            'code'                          => 'STUDENT',
            'name'                          => 'Student Visa',
            'category'                      => 'Student',
            'short_description'             => 'Test',
            'consultation_price_nzd'        => 150.00,
            'consultation_duration_minutes' => 30,
            'estimated_minutes'             => 10,
            'icon'                          => 'GraduationCap',
            'active'                        => true,
        ]);

        $this->seed(VisaChecklistSeeder::class);

        return VisaType::where('code', 'STUDENT')->firstOrFail();
    }

    private function makeImmigrationLead(array $overrides = []): Lead
    {
        return Lead::create(array_merge([
            'lead_id'             => 'LP-IMM-1',
            'first_name'          => 'Aroha',
            'last_name'           => 'Tane',
            'email'               => 'aroha@example.com',
            'is_immigration_case' => true,
            'inz_visa_type'       => 'Student Visa',
            'status'              => 'New Leads',
        ], $overrides));
    }

    // ─── visa.checklist payload (covers spec tests 4, 5, 6) ──────────────

    public function test_04_track_payload_carries_full_visa_checklist_for_immigration_case(): void
    {
        $this->seedStudentVisa();
        $lead = $this->makeImmigrationLead();

        $this->get("/track/{$lead->tracking_code}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('visa.code', 'STUDENT')
                ->where('visa.name', 'Student Visa')
                ->has('visa.checklist', 32)
                ->where('visa.totals.approved', 0)
                ->where('visa.totals.submitted', 0)
            );
    }

    public function test_04b_each_checklist_item_carries_the_shape_the_picker_consumes(): void
    {
        $this->seedStudentVisa();
        $lead = $this->makeImmigrationLead();

        $this->get("/track/{$lead->tracking_code}")
            ->assertInertia(fn ($page) => $page
                ->has('visa.checklist.0', fn ($item) => $item
                    ->has('key')
                    ->has('label')
                    ->has('hint')
                    ->has('required')
                    ->has('status')
                    ->has('count')
                )
                // The seeder embeds the section in the label as
                // "Section · Item Name"; the picker splits on " · ".
                ->where('visa.checklist.0.label', fn ($label) => str_contains($label, ' · '))
            );
    }

    public function test_05_non_immigration_lead_gets_visa_null_so_modal_falls_back_to_doc_types(): void
    {
        $lead = Lead::create([
            'lead_id'             => 'LP-NORMAL-1',
            'first_name'          => 'Sam',
            'last_name'           => 'Smith',
            'email'               => 'sam@example.com',
            'is_immigration_case' => false,
            'status'              => 'New Leads',
        ]);

        $this->get("/track/{$lead->tracking_code}")
            ->assertInertia(fn ($page) => $page
                ->where('visa', null)
                ->where('lead.is_immigration_case', false)
            );
    }

    public function test_06_immigration_lead_without_visa_type_set_gets_visa_null(): void
    {
        $this->seedStudentVisa();
        $lead = $this->makeImmigrationLead(['inz_visa_type' => null]);

        $this->get("/track/{$lead->tracking_code}")
            ->assertInertia(fn ($page) => $page->where('visa', null));
    }

    public function test_06b_immigration_lead_with_unknown_visa_type_still_renders_with_empty_checklist(): void
    {
        // Lead points at a visa we don't catalogue. resolveVisa() returns a
        // bare envelope so the panel still shows the visa name without
        // breaking; the checklist is empty so the modal still falls back
        // to DOC_TYPES (useChecklist evaluates false).
        $lead = $this->makeImmigrationLead(['inz_visa_type' => 'Made-Up Visa']);

        $this->get("/track/{$lead->tracking_code}")
            ->assertInertia(fn ($page) => $page
                ->where('visa.name', 'Made-Up Visa')
                ->has('visa.checklist', 0)
            );
    }

    // ─── upload sets checklist_key (covers spec test 7) ──────────────────

    public function test_07_uploading_sets_lead_document_checklist_key_to_the_picked_item(): void
    {
        $this->seedStudentVisa();
        $lead = $this->makeImmigrationLead();
        Storage::fake('public');

        $this->post("/track/{$lead->tracking_code}/document", [
            'file'          => UploadedFile::fake()->create('passport.pdf', 200, 'application/pdf'),
            'checklist_key' => 'passport',
        ])->assertRedirect();

        $doc = LeadDocument::where('lead_id', $lead->id)->firstOrFail();
        $this->assertSame('passport', $doc->checklist_key);
        $this->assertSame(LeadDocument::STATUS_SUBMITTED, $doc->status);
    }

    // ─── status flips Missing → Submitted (covers spec test 8) ──────────

    public function test_08_uploaded_doc_flips_matching_checklist_item_to_submitted(): void
    {
        $this->seedStudentVisa();
        $lead = $this->makeImmigrationLead();
        Storage::fake('public');

        // Item starts missing.
        $this->get("/track/{$lead->tracking_code}")
            ->assertInertia(fn ($page) => $page->where(
                'visa.checklist',
                fn ($items) => collect($items)->firstWhere('key', 'passport')['status'] === 'missing'
            ));

        // Upload one against passport.
        $this->post("/track/{$lead->tracking_code}/document", [
            'file'          => UploadedFile::fake()->create('passport.pdf', 200, 'application/pdf'),
            'checklist_key' => 'passport',
        ]);

        // Item now shows submitted, totals.submitted incremented.
        $this->get("/track/{$lead->tracking_code}")
            ->assertInertia(fn ($page) => $page
                ->where(
                    'visa.checklist',
                    fn ($items) => collect($items)->firstWhere('key', 'passport')['status'] === 'submitted'
                )
                ->where('visa.totals.submitted', 1)
                ->where('visa.totals.approved', 0)
            );
    }

    public function test_08b_upload_to_unknown_checklist_key_does_not_flip_any_item(): void
    {
        // If the lead uses the "other" fallback, no checklist item should
        // gain status — the doc just lives outside the requirements panel.
        $this->seedStudentVisa();
        $lead = $this->makeImmigrationLead();
        Storage::fake('public');

        $this->post("/track/{$lead->tracking_code}/document", [
            'file'          => UploadedFile::fake()->create('misc.pdf', 100, 'application/pdf'),
            'checklist_key' => 'other',
        ]);

        $this->get("/track/{$lead->tracking_code}")
            ->assertInertia(fn ($page) => $page
                ->where('visa.totals.submitted', 0)
                ->where('visa.totals.approved', 0)
            );
    }

    // ─── status flips Submitted → Approved (covers spec test 9) ─────────

    public function test_09_staff_approval_flips_checklist_item_to_approved_on_track(): void
    {
        $this->seedStudentVisa();
        $lead = $this->makeImmigrationLead();
        Storage::fake('public');

        // Lead uploads.
        $this->post("/track/{$lead->tracking_code}/document", [
            'file'          => UploadedFile::fake()->create('passport.pdf', 200, 'application/pdf'),
            'checklist_key' => 'passport',
        ]);
        $doc = LeadDocument::where('lead_id', $lead->id)->firstOrFail();

        // Staff approves via the admin documents route.
        $this->actingAs($this->admin())
            ->post("/admin/leads/{$lead->id}/documents/{$doc->id}/status", ['status' => 'Approved'])
            ->assertRedirect();

        // Visa Requirements panel now shows the item as approved with
        // totals.approved=1.
        $this->get("/track/{$lead->tracking_code}")
            ->assertInertia(fn ($page) => $page
                ->where(
                    'visa.checklist',
                    fn ($items) => collect($items)->firstWhere('key', 'passport')['status'] === 'approved'
                )
                ->where('visa.totals.approved', 1)
                ->where('visa.totals.submitted', 1)
            );
    }

    // ─── New tabbed-layout coverage (servable-testable subset) ──────────

    public function test_10_track_page_renders_with_tabbed_layout_component(): void
    {
        // Confirms the redesigned page still mounts the same Inertia
        // component name so the React layout swap doesn't break direct
        // links or shared bookmarks.
        $this->seedStudentVisa();
        $lead = $this->makeImmigrationLead();

        $this->get("/track/{$lead->tracking_code}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('track/TrackingPage'));
    }

    public function test_11_track_page_payload_carries_data_for_every_tab(): void
    {
        // The tab strip is client-only React state; the page needs all
        // four data prop families (lead/info, documents, visa.checklist,
        // timeline) to be present so any tab the user lands on renders.
        $this->seedStudentVisa();
        $lead = $this->makeImmigrationLead();

        $this->get("/track/{$lead->tracking_code}")
            ->assertInertia(fn ($page) => $page
                ->has('lead')
                ->has('info')
                ->has('documents')
                ->has('visa.checklist')
                ->has('timeline')
            );
    }

    public function test_12_journey_carries_completed_current_and_pending_steps(): void
    {
        // The JourneySnapshot picks the last completed + first current +
        // next pending out of the timeline. The server must emit a
        // timeline shape that supports this calculation.
        $this->seedStudentVisa();
        $lead = $this->makeImmigrationLead([
            'date_of_first_contact' => now()->subDays(5),
            'date_of_engagement'    => now()->subDays(3),
        ]);

        $this->get("/track/{$lead->tracking_code}")
            ->assertInertia(fn ($page) => $page
                ->where('timeline', fn ($timeline) => collect($timeline)->contains(fn ($step) => $step['status'] === 'completed'))
                ->where('timeline', fn ($timeline) => collect($timeline)->contains(fn ($step) => $step['status'] === 'current'))
                ->where('timeline', fn ($timeline) => collect($timeline)->contains(fn ($step) => $step['status'] === 'pending'))
            );
    }

    public function test_13_journey_first_step_is_current_when_nothing_started(): void
    {
        // Edge case for the snapshot's COMPLETED card: a brand-new lead
        // has no completed step yet, so the snapshot should fall back to
        // the "Application started" empty state. The server signal is
        // that no step in the timeline carries status='completed'.
        $this->seedStudentVisa();
        $lead = $this->makeImmigrationLead([
            'date_of_first_contact' => null,
            'date_of_engagement'    => null,
        ]);

        $this->get("/track/{$lead->tracking_code}")
            ->assertInertia(fn ($page) => $page
                ->where('timeline.0.status', 'current')
                ->where('timeline', fn ($timeline) => collect($timeline)->doesntContain(fn ($step) => $step['status'] === 'completed'))
            );
    }

    public function test_14_declined_outcome_appends_alternative_step_to_journey(): void
    {
        // Terminal state: when the case is declined, the journey
        // snapshot replaces the trio with a single Declined card. The
        // server signal is an extra step at the end of the timeline
        // tagged with the 'alternative' marker.
        $this->seedStudentVisa();
        $lead = $this->makeImmigrationLead([
            'immigration_stage' => 'Decline Visa',
            'inz_decision_at'   => now()->subDay(),
        ]);

        $this->get("/track/{$lead->tracking_code}")
            ->assertInertia(fn ($page) => $page
                ->where('timeline', fn ($timeline) =>
                    collect($timeline)->last()['key'] === 'application_declined'
                )
            );
    }
}
