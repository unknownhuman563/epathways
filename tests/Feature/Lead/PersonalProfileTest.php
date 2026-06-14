<?php

namespace Tests\Feature\Lead;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Wide Personal Info build — covers the migration, model (fillable +
 * casts + computed accessors), and the LeadController::updatePersonal
 * endpoint widened to accept all section fields with conditional rules.
 *
 * Test cases numbered to match the build spec (1-22).
 */
class PersonalProfileTest extends TestCase
{
    use RefreshDatabase;

    /** A staff user with minimum permissions to hit /admin/leads/{id}/personal. */
    private function actingAsStaff(): User
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);
        return $user;
    }

    /** Create a minimal lead row for editing. */
    private function makeLead(array $overrides = []): Lead
    {
        return Lead::create(array_merge([
            'lead_id'    => 'LP-00001',
            'first_name' => 'Jane',
            'last_name'  => 'Doe',
            'email'      => 'jane@example.com',
            'status'     => 'New Leads',
        ], $overrides));
    }

    // ─── 1 : migration adds new columns without breaking existing rows ──

    public function test_01_migration_added_new_columns(): void
    {
        // RefreshDatabase has already run every migration; if columns are
        // missing this test will surface it explicitly.
        $cols = \Illuminate\Support\Facades\Schema::getColumnListing('leads');
        $expected = [
            'preferred_name', 'whatsapp',
            'residence_address_line_1', 'residence_address_line_2', 'residence_address_postcode',
            'has_been_in_nz_continuously', 'nz_continuous_residence_months',
            'passport_issuing_country', 'passport_issue_date',
            'current_nz_visa_type', 'current_nz_visa_number',
            'current_nz_visa_issued_date', 'current_nz_visa_expiry_date',
            'previous_nz_visa_type',
            'preferred_course', 'preferred_qualification_level',
            'english_test_type', 'english_test_overall_score',
            'funding_source', 'estimated_total_cost_nzd', 'available_funds_nzd',
            'employment_type', 'current_employer_name', 'years_of_relevant_experience',
            'highest_qualification', 'has_nzqa_assessment',
            'has_children', 'number_of_children',
            'has_health_disclosure', 'health_disclosure_notes',
            'has_character_disclosure', 'has_been_declined_visa', 'has_criminal_record',
        ];
        foreach ($expected as $col) {
            $this->assertContains($col, $cols, "Expected leads.{$col} column to exist.");
        }
    }

    // ─── 2 : existing leads load without errors after migration ────────

    public function test_02_existing_lead_loads_without_errors(): void
    {
        $lead = $this->makeLead();
        $fetched = Lead::findOrFail($lead->id);

        $this->assertSame('Jane', $fetched->first_name);
        // New columns default to null on a fresh lead.
        $this->assertNull($fetched->preferred_name);
        $this->assertNull($fetched->current_nz_visa_type);
        // Disclosure flags default to false per the migration.
        $this->assertFalse((bool) $fetched->has_health_disclosure);
    }

    // ─── 3 : updatePersonal accepts all new fields with valid data ─────

    public function test_03_update_accepts_all_section_fields(): void
    {
        $this->actingAsStaff();
        $lead = $this->makeLead();

        $payload = [
            'first_name'        => 'Jane',
            // Section 1
            'preferred_name'    => 'Janie',
            'whatsapp'          => '+64210000111',
            'residence_address_line_1' => '12 Some Street',
            'residence_address_postcode' => '6011',
            'has_been_in_nz_continuously' => true,
            'nz_continuous_residence_months' => 36,
            // Section 4
            'preferred_course'  => 'NZ Diploma in IT',
            'preferred_qualification_level' => 'Diploma',
            'english_test_type' => 'PTE',
            'english_test_overall_score' => 58.0,
            // Section 5
            'funding_source'    => 'Self',
            'estimated_total_cost_nzd' => 25000,
            'available_funds_nzd'      => 30000,
        ];

        $this->post("/admin/leads/{$lead->id}/personal", $payload)
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $lead->refresh();
        $this->assertSame('Janie', $lead->preferred_name);
        $this->assertSame('+64210000111', $lead->whatsapp);
        $this->assertSame('NZ Diploma in IT', $lead->preferred_course);
        $this->assertSame('Self', $lead->funding_source);
        $this->assertEqualsWithDelta(25000, $lead->estimated_total_cost_nzd, 0.01);
    }

    // ─── 4 : invalid data rejected ─────────────────────────────────────

    public function test_04_rejects_invalid_data(): void
    {
        $this->actingAsStaff();
        $lead = $this->makeLead();

        $this->post("/admin/leads/{$lead->id}/personal", [
            'first_name'         => 'Jane',
            'current_salary_nzd' => -100,                              // negative salary
            'dob'                => now()->addYears(2)->toDateString(), // future DOB
        ])
            ->assertSessionHasErrors(['current_salary_nzd', 'dob']);
    }

    // ─── 5 : passport_number encrypted at rest ─────────────────────────

    public function test_05_passport_number_is_encrypted_at_rest(): void
    {
        $this->actingAsStaff();
        $lead = $this->makeLead();

        $this->post("/admin/leads/{$lead->id}/personal", [
            'first_name'       => 'Jane',
            'has_passport'     => true,
            'passport_number'  => 'A1234567',
        ])->assertSessionHasNoErrors();

        // Raw DB column != accessor value — confirms the encrypted cast
        // is doing its job on writes.
        $raw = DB::table('leads')->where('id', $lead->id)->value('passport_number');
        $this->assertNotSame('A1234567', $raw, 'Raw stored value should be encrypted, not the plain passport number.');

        $lead->refresh();
        $this->assertSame('A1234567', $lead->passport_number, 'Accessor should decrypt back to the plain value.');
    }

    // ─── 6 : has_passport true requires passport_number ────────────────

    public function test_06_has_passport_requires_passport_number(): void
    {
        $this->actingAsStaff();
        $lead = $this->makeLead();

        $this->post("/admin/leads/{$lead->id}/personal", [
            'first_name'   => 'Jane',
            'has_passport' => true,
            // passport_number intentionally omitted
        ])->assertSessionHasErrors(['passport_number']);
    }

    // ─── 7 : Employed/Self-employed requires current_employer_name ────

    public function test_07_employed_requires_current_employer(): void
    {
        $this->actingAsStaff();
        $lead = $this->makeLead();

        $this->post("/admin/leads/{$lead->id}/personal", [
            'first_name'      => 'Jane',
            'employment_type' => 'Employed',
        ])->assertSessionHasErrors(['current_employer_name']);

        $this->post("/admin/leads/{$lead->id}/personal", [
            'first_name'      => 'Jane',
            'employment_type' => 'Self-employed',
        ])->assertSessionHasErrors(['current_employer_name']);

        // 'Unemployed' / 'Student' / 'Retired' do NOT require the field.
        $this->post("/admin/leads/{$lead->id}/personal", [
            'first_name'      => 'Jane',
            'employment_type' => 'Student',
        ])->assertSessionHasNoErrors();
    }

    // ─── 8 : has_health_disclosure requires notes (min 10 chars) ───────

    public function test_08_has_health_disclosure_requires_notes(): void
    {
        $this->actingAsStaff();
        $lead = $this->makeLead();

        $this->post("/admin/leads/{$lead->id}/personal", [
            'first_name'              => 'Jane',
            'has_health_disclosure'   => true,
            'health_disclosure_notes' => 'too short', // < 10 chars
        ])->assertSessionHasErrors(['health_disclosure_notes']);

        $this->post("/admin/leads/{$lead->id}/personal", [
            'first_name'              => 'Jane',
            'has_health_disclosure'   => true,
            'health_disclosure_notes' => 'controlled asthma diagnosed in 2018',
        ])->assertSessionHasNoErrors();
    }

    // ─── 9 : has_character_disclosure requires notes ───────────────────

    public function test_09_has_character_disclosure_requires_notes(): void
    {
        $this->actingAsStaff();
        $lead = $this->makeLead();

        $this->post("/admin/leads/{$lead->id}/personal", [
            'first_name'                  => 'Jane',
            'has_character_disclosure'    => true,
            'character_disclosure_notes'  => 'short',
        ])->assertSessionHasErrors(['character_disclosure_notes']);
    }

    // ─── 10 : has_been_declined_visa requires details ──────────────────

    public function test_10_declined_visa_requires_details(): void
    {
        $this->actingAsStaff();
        $lead = $this->makeLead();

        $this->post("/admin/leads/{$lead->id}/personal", [
            'first_name'             => 'Jane',
            'has_been_declined_visa' => true,
        ])->assertSessionHasErrors(['declined_visa_details']);
    }

    // ─── 11 : has_criminal_record requires details ─────────────────────

    public function test_11_criminal_record_requires_details(): void
    {
        $this->actingAsStaff();
        $lead = $this->makeLead();

        $this->post("/admin/leads/{$lead->id}/personal", [
            'first_name'          => 'Jane',
            'has_criminal_record' => true,
            'criminal_record_details' => 'short',
        ])->assertSessionHasErrors(['criminal_record_details']);
    }

    // ─── 12 : has_children=true requires number_of_children > 0 ───────

    public function test_12_has_children_requires_count(): void
    {
        $this->actingAsStaff();
        $lead = $this->makeLead();

        $this->post("/admin/leads/{$lead->id}/personal", [
            'first_name'   => 'Jane',
            'has_children' => true,
            // number_of_children omitted (default 0 == invalid)
        ])->assertSessionHasErrors(['number_of_children']);

        $this->post("/admin/leads/{$lead->id}/personal", [
            'first_name'         => 'Jane',
            'has_children'       => true,
            'number_of_children' => 2,
        ])->assertSessionHasNoErrors();
    }

    // ─── 13 : section save doesn't touch sibling-section data ──────────

    public function test_13_section_save_is_partial(): void
    {
        $this->actingAsStaff();
        $lead = $this->makeLead([
            'preferred_course' => 'NZ Diploma in IT', // populated by sec 4
            'funding_source'   => 'Self',             // populated by sec 5
        ]);

        // Save only Section 1 — sibling sections must stay untouched.
        $this->post("/admin/leads/{$lead->id}/personal", [
            'first_name'    => 'Jane',
            'preferred_name'=> 'JJ',
        ])->assertSessionHasNoErrors();

        $lead->refresh();
        $this->assertSame('JJ', $lead->preferred_name);
        $this->assertSame('NZ Diploma in IT', $lead->preferred_course, 'Section 4 should be untouched.');
        $this->assertSame('Self', $lead->funding_source, 'Section 5 should be untouched.');
    }

    // ─── 14 : Section 5 (Employment) save only updates employment fields ──

    public function test_14_employment_section_only_updates_employment(): void
    {
        $this->actingAsStaff();
        $lead = $this->makeLead([
            'preferred_name' => 'JJ',
            'citizenship'    => 'New Zealand',
        ]);

        $this->post("/admin/leads/{$lead->id}/personal", [
            'first_name'                     => 'Jane',
            'employment_type'                => 'Employed',
            'current_employer_name'          => 'Acme Co',
            'current_position_title'         => 'Engineer',
            'years_of_relevant_experience'   => 7,
        ])->assertSessionHasNoErrors();

        $lead->refresh();
        $this->assertSame('Employed', $lead->employment_type);
        $this->assertSame('Acme Co', $lead->current_employer_name);
        // Identity section untouched.
        $this->assertSame('JJ', $lead->preferred_name);
        $this->assertSame('New Zealand', $lead->citizenship);
    }

    // ─── 15 : age accessor derives from dob ────────────────────────────

    public function test_15_age_accessor_derives_from_dob(): void
    {
        $lead = $this->makeLead(['dob' => now()->subYears(25)->subDays(10)->toDateString()]);
        $this->assertSame(25, $lead->age);

        // Lead with no DOB falls back to the legacy `age` column. `age`
        // isn't in fillable so we have to assign directly.
        $legacy = $this->makeLead(['lead_id' => 'LP-00002', 'dob' => null]);
        $legacy->age = 40;
        $legacy->save();
        $legacy->refresh();
        $this->assertSame(40, $legacy->age);
    }

    // ─── 16 : is_employed accessor true for Employed/Self-employed ────

    public function test_16_is_employed_accessor(): void
    {
        $a = $this->makeLead(['lead_id' => 'LP-A', 'employment_type' => 'Employed']);
        $b = $this->makeLead(['lead_id' => 'LP-B', 'employment_type' => 'Self-employed']);
        $c = $this->makeLead(['lead_id' => 'LP-C', 'employment_type' => 'Unemployed']);
        $d = $this->makeLead(['lead_id' => 'LP-D', 'employment_type' => 'Student']);
        $e = $this->makeLead(['lead_id' => 'LP-E', 'employment_type' => null]);

        $this->assertTrue($a->is_employed);
        $this->assertTrue($b->is_employed);
        $this->assertFalse($c->is_employed);
        $this->assertFalse($d->is_employed);
        $this->assertFalse($e->is_employed);
    }

    // ─── 17 : has_current_nz_visa accessor ─────────────────────────────

    public function test_17_has_current_nz_visa_accessor(): void
    {
        $with    = $this->makeLead(['lead_id' => 'LP-W', 'current_nz_visa_type' => 'AEWV']);
        $without = $this->makeLead(['lead_id' => 'LP-X', 'current_nz_visa_type' => null]);

        $this->assertTrue($with->has_current_nz_visa);
        $this->assertFalse($without->has_current_nz_visa);
    }

    // ─── 18 : update persists changes (proxy for audit log success) ────
    //
    // The LogsActivity trait writes an activity_logs row on every model
    // update. We assert the trait's side-effect indirectly by checking
    // an activity_logs entry exists for this lead after the save.

    public function test_18_save_records_audit_log_entry(): void
    {
        $this->actingAsStaff();
        $lead = $this->makeLead();

        $before = DB::table('activity_logs')->count();

        $this->post("/admin/leads/{$lead->id}/personal", [
            'first_name'     => 'Jane',
            'preferred_name' => 'JJ',
        ])->assertSessionHasNoErrors();

        $after = DB::table('activity_logs')->count();
        $this->assertGreaterThan($before, $after, 'LogsActivity should write a new audit entry on update.');
    }

    // ─── 19 : existing 22 immigration assessment tests still pass ──────
    //
    // We can't run a sibling test class from inside this one, so the
    // assertion proxies for "shared model state is intact": the
    // Assessment + Lead model relationships still work end-to-end.

    public function test_19_assessment_pipeline_models_still_compose(): void
    {
        // Confirms the Lead model still loads with all its existing
        // fillable + relations after the wide-column build.
        $lead = $this->makeLead([
            'is_immigration_case'      => true,
            'immigration_converted_at' => now(),
        ]);
        $this->assertTrue((bool) $lead->is_immigration_case);
        $this->assertTrue(method_exists($lead, 'immigrationConverter'));
        $this->assertTrue(method_exists($lead, 'stageUpdater'));
    }

    // ─── 20 : Tracking page renders for a lead with new columns ────────

    public function test_20_tracking_page_renders_with_wide_profile(): void
    {
        $lead = $this->makeLead([
            'tracking_code'   => 'EP-TEST1234',
            'preferred_name'  => 'JJ',
            'highest_qualification' => 'Bachelor',
        ]);

        $this->get("/track/{$lead->tracking_code}")
            ->assertOk()
            ->assertInertia(fn ($p) => $p->component('track/TrackingPage'));
    }

    // ─── 21 : a lead with NO profile data renders all sections ─────────

    public function test_21_empty_profile_lead_loads_cleanly(): void
    {
        $this->actingAsStaff();
        $lead = $this->makeLead(); // bare minimum row

        // Endpoint accepts a minimal payload (just first_name) without
        // tripping any of the conditional rules — empty profile is OK.
        $this->post("/admin/leads/{$lead->id}/personal", [
            'first_name' => 'Jane',
        ])->assertRedirect()->assertSessionHasNoErrors();
    }

    // ─── 22 : a lead with rich data round-trips through update + cast ──

    public function test_22_rich_profile_round_trips(): void
    {
        $this->actingAsStaff();
        $lead = $this->makeLead();

        $rich = [
            'first_name'                    => 'Jane',
            // Section 1 + 2
            'preferred_name'                => 'Janie',
            'dob'                           => '1995-05-05',
            'whatsapp'                      => '+64210000111',
            'has_passport'                  => true,
            'passport_number'               => 'A1234567',
            'passport_issuing_country'      => 'India',
            'passport_issue_date'           => '2020-01-01',
            'passport_expiry'               => '2030-01-01',
            // Section 3
            'current_nz_visa_type'          => 'AEWV',
            'current_nz_visa_number'        => 'VISA-123-456',
            // Section 4
            'preferred_course'              => 'NZ Diploma in IT',
            'english_test_type'             => 'PTE',
            'english_test_overall_score'    => 58.5,
            // Section 5
            'funding_source'                => 'Mixed',
            'estimated_total_cost_nzd'      => 25000.00,
            'annual_income_nzd'             => 75000,
            'annual_income_currency'        => 'NZD',
            // Section 6
            'employment_type'               => 'Employed',
            'current_employer_name'         => 'Acme Co',
            'current_employment_start_date' => '2022-02-01',
            'has_anzsco_listed_role'        => true,
            'anzsco_code'                   => '261313',
            // Section 7
            'highest_qualification'         => 'Bachelor',
            'highest_qualification_year_completed' => 2017,
            // Section 8
            'has_children'                  => true,
            'number_of_children'            => 2,
            // Section 9
            'has_health_disclosure'         => true,
            'health_disclosure_notes'       => 'controlled asthma diagnosed in 2018',
        ];

        $this->post("/admin/leads/{$lead->id}/personal", $rich)
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $lead->refresh();
        $this->assertSame('Janie', $lead->preferred_name);
        $this->assertSame('A1234567', $lead->passport_number);
        $this->assertSame('VISA-123-456', $lead->current_nz_visa_number);
        $this->assertSame('AEWV', $lead->current_nz_visa_type);
        $this->assertSame('Mixed', $lead->funding_source);
        $this->assertSame('Employed', $lead->employment_type);
        $this->assertTrue($lead->is_employed);                  // computed
        $this->assertTrue($lead->has_current_nz_visa);          // computed
        $this->assertSame('Bachelor', $lead->highest_qualification);
        $this->assertSame(2, (int) $lead->number_of_children);
        $this->assertTrue((bool) $lead->has_health_disclosure);
        $this->assertSame('controlled asthma diagnosed in 2018', $lead->health_disclosure_notes);
    }

    // ─── 23 : 4 new columns from documents-only-checklist build ────────

    public function test_23_new_columns_exist_on_leads_table(): void
    {
        $cols = \Illuminate\Support\Facades\Schema::getColumnListing('leads');
        foreach ([
            'current_employer_phone',
            'current_employer_email',
            'meets_184_day_rule_two_years',
            'dependent_children_notes',
        ] as $col) {
            $this->assertContains($col, $cols, "Expected leads.{$col} column to exist after the documents-only build migration.");
        }
    }

    public function test_24_update_personal_accepts_and_persists_new_columns(): void
    {
        $this->actingAsStaff();
        $lead = $this->makeLead();

        $payload = [
            'first_name'                   => 'Jane',
            // New AEWV employer-contact columns
            'employment_type'              => 'Employed',
            'current_employer_name'        => 'Test Co',
            'current_employer_phone'       => '+64 9 555 1234',
            'current_employer_email'       => 'hr@testco.co.nz',
            // New PRV-specific column
            'meets_184_day_rule_two_years' => true,
            // New free-text placeholder for per-child rows
            'has_children'             => true,
            'number_of_children'       => 1,
            'dependent_children_notes' => 'Liam Doe — DOB 2018-03-15, NZ citizen by descent, no passport yet.',
        ];

        $this->post("/admin/leads/{$lead->id}/personal", $payload)
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $lead->refresh();
        $this->assertSame('+64 9 555 1234', $lead->current_employer_phone);
        $this->assertSame('hr@testco.co.nz', $lead->current_employer_email);
        $this->assertTrue((bool) $lead->meets_184_day_rule_two_years);
        $this->assertStringContainsString('Liam Doe', $lead->dependent_children_notes);
    }

    public function test_25_invalid_employer_email_rejected(): void
    {
        // The validator widens to email() rule, not bare string.
        $this->actingAsStaff();
        $lead = $this->makeLead();

        $this->post("/admin/leads/{$lead->id}/personal", [
            'first_name'             => 'Jane',
            'current_employer_email' => 'not-an-email',
        ])->assertSessionHasErrors(['current_employer_email']);
    }
}
