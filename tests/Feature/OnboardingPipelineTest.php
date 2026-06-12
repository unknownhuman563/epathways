<?php

namespace Tests\Feature;

use App\Models\EoiSubmission;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as AssertInertia;
use Tests\TestCase;

class OnboardingPipelineTest extends TestCase
{
    use RefreshDatabase;

    private function user(): User
    {
        return User::factory()->create(['role' => 'accommodation']);
    }

    private function property(array $o = []): Property
    {
        return Property::create(array_merge([
            'name' => 'Test House', 'rent_single' => 200, 'status' => 'available',
            'is_active' => true, 'total_rooms' => 4, 'code' => '1', 'address' => '1 Test St',
        ], $o));
    }

    /** Full set of NOT-NULL EOI fields + overrides. */
    private function eoi(array $o = []): array
    {
        return array_merge([
            'full_legal_name' => 'Jane Q Doe', 'id_number' => 'LX1', 'visa_status' => 'Work Visa',
            'nationality' => 'Filipino', 'preferred_name' => 'Jane', 'email' => 'jane@example.com',
            'mobile' => '0211234567', 'age' => 28,
            'room_type_interest' => 'One Ensuite Room (private toilet and bathroom)',
            'tenancy_start_date' => '2026-07-01', 'stay_duration' => '12 months',
            'occupants' => 'Just me', 'occupant_ages' => '28', 'employment_status' => 'Full-time employment',
            'current_address' => '1 Test St', 'current_address_duration' => '2 years',
            'living_situation' => 'Renting', 'reason_for_moving' => 'Closer to work',
            'drinks_alcohol' => 'Socially', 'work_hours' => 'Day', 'flatmate_description' => 'Tidy',
            'preferred_viewing_time' => 'Flexible',
        ], $o);
    }

    private function submission(array $o = []): EoiSubmission
    {
        return EoiSubmission::create($this->eoi(array_merge(['form_type' => 'cold'], $o)));
    }

    private function patchStatus(EoiSubmission $s, array $payload)
    {
        return $this->actingAs($this->user())
            ->from("/portal/accommodation/applications/{$s->id}")
            ->patch("/portal/accommodation/applications/{$s->id}/status", $payload);
    }

    // ---- Public submission still works -----------------------------------

    public function test_public_cold_submission_still_works(): void // 1
    {
        $this->post('/accommodation/expression-of-interest-cold', $this->fullPublic())
            ->assertRedirect('/accommodation/expression-of-interest-cold');
        $this->assertDatabaseHas('accommodation_eoi_submissions', ['email' => 'jane@example.com', 'form_type' => 'cold', 'status' => 'new']);
    }

    public function test_public_hot_submission_still_works(): void // 2
    {
        $this->post('/accommodation/expression-of-interest-hot', $this->fullPublic(['property_interested' => 'Glenfield Room']))
            ->assertRedirect('/accommodation/expression-of-interest-hot');
        $this->assertDatabaseHas('accommodation_eoi_submissions', ['form_type' => 'hot', 'property_interested' => 'Glenfield Room']);
    }

    public function test_hot_submission_stores_property_interested(): void // 3
    {
        $this->post('/accommodation/expression-of-interest-hot', $this->fullPublic(['property_interested' => 'Vazey Way']));
        $this->assertDatabaseHas('accommodation_eoi_submissions', ['form_type' => 'hot', 'property_interested' => 'Vazey Way', 'lead_temperature' => 'hot']);
    }

    public function test_staff_list_returns_submissions(): void // 4
    {
        $this->submission(['status' => 'reviewed']);
        $this->actingAs($this->user())->get('/portal/accommodation/onboarding')
            ->assertInertia(fn (AssertInertia $p) => $p->component('portal/accommodation/Applications')->has('submissions.data', 1));
    }

    // ---- State machine ----------------------------------------------------

    public function test_valid_transition_succeeds(): void // 5
    {
        $s = $this->submission(); // new
        $this->patchStatus($s, ['status' => 'reviewed'])->assertRedirect();
        $this->assertEquals('reviewed', $s->fresh()->status);
    }

    public function test_invalid_transition_fails(): void // 6
    {
        $s = $this->submission(); // new -> agreement_sent is not allowed
        $this->patchStatus($s, ['status' => 'agreement_sent'])->assertSessionHasErrors(['status']);
        $this->assertEquals('new', $s->fresh()->status);
    }

    public function test_viewing_booked_requires_scheduled_at(): void // 7
    {
        $s = $this->submission(['status' => 'shortlisted']);
        $this->patchStatus($s, ['status' => 'viewing_booked'])->assertSessionHasErrors(['viewing_scheduled_at']);

        $this->patchStatus($s, ['status' => 'viewing_booked', 'viewing_scheduled_at' => '2026-07-01 10:00:00'])->assertRedirect();
        $this->assertEquals('viewing_booked', $s->fresh()->status);
        $this->assertNotNull($s->fresh()->viewing_scheduled_at);
    }

    public function test_invoice_sent_requires_amount(): void // 8
    {
        $s = $this->submission(['status' => 'agreement_signed']);
        $this->patchStatus($s, ['status' => 'invoice_sent'])->assertSessionHasErrors(['invoice_amount_nzd']);
    }

    // ---- Convert to tenant ------------------------------------------------

    public function test_convert_creates_links_and_moves_in(): void // 9, 10, 11, 12
    {
        $property = $this->property();
        $s = $this->submission(['status' => 'payment_confirmed', 'property_id' => $property->id]);

        $this->actingAs($this->user())
            ->post("/portal/accommodation/applications/{$s->id}/convert", [
                'property_id' => $property->id, 'first_name' => 'Jane', 'family_name' => 'Doe',
                'contract_type' => 'fixed_term', 'contract_start' => '2026-07-01', 'weekly_rent_nzd' => 250,
            ])->assertRedirect();

        $tenant = Tenant::where('first_name', 'Jane')->first();
        $this->assertNotNull($tenant);                                      // 10 created
        $this->assertEquals($property->id, $tenant->property_id);
        $this->assertEquals($s->id, $tenant->converted_from_viewer_id);    // bridge activated
        $this->assertEquals($tenant->id, $s->fresh()->converted_to_tenant_id); // 11 linked
        $this->assertEquals('moved_in', $s->fresh()->status);              // 12 moved_in
    }

    public function test_convert_blocked_before_payment(): void
    {
        $property = $this->property();
        $s = $this->submission(['status' => 'reviewed', 'property_id' => $property->id]);
        $this->actingAs($this->user())
            ->from("/portal/accommodation/applications/{$s->id}")
            ->post("/portal/accommodation/applications/{$s->id}/convert", [
                'property_id' => $property->id, 'first_name' => 'Jane', 'family_name' => 'Doe',
                'contract_type' => 'fixed_term', 'contract_start' => '2026-07-01',
            ]);
        $this->assertNull($s->fresh()->converted_to_tenant_id);
    }

    // ---- Custom actions ---------------------------------------------------

    public function test_assign_to_user(): void // 13
    {
        $s = $this->submission();
        $assignee = $this->user();
        $this->actingAs($this->user())
            ->post("/portal/accommodation/applications/{$s->id}/assign", ['user_id' => $assignee->id])
            ->assertRedirect();
        $this->assertEquals($assignee->id, $s->fresh()->assigned_to_user_id);
    }

    public function test_link_to_property_backfills_string(): void // 14
    {
        $property = $this->property(['address' => '99 Linked Rd']);
        $s = $this->submission(['property_interested' => null]);
        $this->actingAs($this->user())
            ->post("/portal/accommodation/applications/{$s->id}/link-property", ['property_id' => $property->id])
            ->assertRedirect();
        $fresh = $s->fresh();
        $this->assertEquals($property->id, $fresh->property_id);
        $this->assertEquals('99 Linked Rd', $fresh->property_interested);
    }

    public function test_add_internal_note_appends(): void // 15
    {
        $s = $this->submission();
        $this->actingAs($this->user())->post("/portal/accommodation/applications/{$s->id}/note", ['note' => 'Called applicant']);
        $this->assertStringContainsString('Called applicant', $s->fresh()->internal_notes);
        $this->assertStringContainsString(now()->toDateString(), $s->fresh()->internal_notes);
    }

    // ---- Soft delete ------------------------------------------------------

    public function test_soft_delete_only_terminal(): void // 16, 17
    {
        $active = $this->submission(['status' => 'reviewed']);
        $this->actingAs($this->user())->delete("/portal/accommodation/applications/{$active->id}");
        $this->assertNull($active->fresh()->deleted_at);             // 17 active not deleted

        $declined = $this->submission(['status' => 'declined']);
        $this->actingAs($this->user())->delete("/portal/accommodation/applications/{$declined->id}");
        $this->assertSoftDeleted($declined);                          // 16 terminal deleted
    }

    // ---- Data / filters ---------------------------------------------------

    public function test_lead_temperature_denormalized(): void // 18
    {
        $hot = EoiSubmission::create($this->eoi(['form_type' => 'hot', 'property_interested' => 'X']));
        $this->assertEquals('hot', $hot->lead_temperature);
    }

    public function test_active_pipeline_excludes_terminals(): void // 19
    {
        $this->submission(['status' => 'reviewed']);
        $this->submission(['status' => 'moved_in']);
        $this->submission(['status' => 'declined']);

        $this->actingAs($this->user())->get('/portal/accommodation/onboarding')
            ->assertInertia(fn (AssertInertia $p) => $p->has('submissions.data', 1)); // only the active one
    }

    public function test_stalling_filter(): void // 20
    {
        $stale = $this->submission(['status' => 'reviewed']);
        DB::table('accommodation_eoi_submissions')->where('id', $stale->id)->update(['updated_at' => now()->subDays(10)]);
        $this->submission(['status' => 'reviewed']); // fresh

        $this->actingAs($this->user())->get('/portal/accommodation/onboarding?days_at_stage_min=7')
            ->assertInertia(fn (AssertInertia $p) => $p->has('submissions.data', 1));
    }

    public function test_hot_cold_filter(): void // 21
    {
        EoiSubmission::create($this->eoi(['form_type' => 'hot', 'property_interested' => 'X', 'status' => 'reviewed']));
        EoiSubmission::create($this->eoi(['form_type' => 'cold', 'status' => 'reviewed']));

        $this->actingAs($this->user())->get('/portal/accommodation/onboarding?lead_temperature=hot')
            ->assertInertia(fn (AssertInertia $p) => $p->has('submissions.data', 1));
    }

    public function test_days_at_stage_calculates(): void // 22
    {
        $s = $this->submission();
        DB::table('accommodation_eoi_submissions')->where('id', $s->id)->update(['updated_at' => now()->subDays(5)]);
        $this->assertEquals(5, $s->fresh()->days_at_current_stage);
    }

    /** Public form payload (EOI fields + booleans + consent). */
    private function fullPublic(array $o = []): array
    {
        return array_merge($this->eoi(), [
            'has_children' => false, 'has_pets' => false, 'has_rented_before' => true,
            'smokes_or_vapes' => false, 'viewing_available_7days' => true,
            'confirm_accurate' => true, 'consent_collection' => true,
        ], $o);
    }
}
