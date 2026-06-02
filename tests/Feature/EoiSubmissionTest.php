<?php

namespace Tests\Feature;

use App\Models\EoiSubmission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EoiSubmissionTest extends TestCase
{
    use RefreshDatabase;

    private function accommodationUser(): User
    {
        return User::factory()->create(['role' => 'accommodation']);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'full_legal_name' => 'Jane Q Doe',
            'id_number' => 'LX123456',
            'visa_status' => 'Work Visa',
            'nationality' => 'Filipino',
            'preferred_name' => 'Jane',
            'email' => 'jane@example.com',
            'mobile' => '0211234567',
            'age' => 28,
            'room_type_interest' => 'One Ensuite Room (private toilet and bathroom)',
            'tenancy_start_date' => '2026-07-01',
            'stay_duration' => '12 months',
            'occupants' => 'Just me',
            'occupant_ages' => '28',
            'has_children' => false,
            'has_pets' => false,
            'employment_status' => 'Full-time employment',
            'current_address' => '1 Test St, Glenfield, Auckland',
            'has_rented_before' => true,
            'current_address_duration' => '2 years',
            'living_situation' => 'Renting',
            'reason_for_moving' => 'Closer to work',
            'smokes_or_vapes' => false,
            'drinks_alcohol' => 'Socially',
            'work_hours' => 'Day',
            'flatmate_description' => 'Tidy and quiet',
            'viewing_available_7days' => true,
            'preferred_viewing_time' => 'Flexible',
            'confirm_accurate' => true,
            'consent_collection' => true,
        ], $overrides);
    }

    public function test_public_can_submit_expression_of_interest(): void
    {
        $this->post('/accommodation/expression-of-interest-cold', $this->payload())
            ->assertRedirect('/accommodation/expression-of-interest-cold');

        $this->assertDatabaseHas('accommodation_eoi_submissions', [
            'email' => 'jane@example.com',
            'status' => 'new',
            'form_type' => 'cold',
        ]);
    }

    public function test_submission_rejects_missing_required_fields(): void
    {
        $this->from('/accommodation/expression-of-interest-cold')
            ->post('/accommodation/expression-of-interest-cold', [])
            ->assertSessionHasErrors(['full_legal_name', 'visa_status', 'email', 'confirm_accurate', 'consent_collection']);

        $this->assertDatabaseCount('accommodation_eoi_submissions', 0);
    }

    public function test_other_visa_status_requires_detail(): void
    {
        $this->from('/accommodation/expression-of-interest-cold')
            ->post('/accommodation/expression-of-interest-cold', $this->payload(['visa_status' => 'Other', 'visa_status_other' => '']))
            ->assertSessionHasErrors(['visa_status_other']);
    }

    public function test_applications_index_requires_portal_access(): void
    {
        $this->get('/portal/accommodation/applications')->assertRedirect('/login');

        $sales = User::factory()->create(['role' => 'sales']);
        $this->actingAs($sales)->get('/portal/accommodation/applications')->assertForbidden();

        $this->actingAs($this->accommodationUser())
            ->get('/portal/accommodation/applications')
            ->assertOk();
    }

    public function test_status_can_be_updated(): void
    {
        $submission = EoiSubmission::create($this->payload());

        $this->actingAs($this->accommodationUser())
            ->patch("/portal/accommodation/applications/{$submission->id}/status", ['status' => 'reviewed'])
            ->assertRedirect();

        $this->assertDatabaseHas('accommodation_eoi_submissions', [
            'id' => $submission->id,
            'status' => 'reviewed',
        ]);
    }

    public function test_status_update_rejects_invalid_value(): void
    {
        $submission = EoiSubmission::create($this->payload());

        $this->actingAs($this->accommodationUser())
            ->from("/portal/accommodation/applications/{$submission->id}")
            ->patch("/portal/accommodation/applications/{$submission->id}/status", ['status' => 'bogus'])
            ->assertSessionHasErrors(['status']);
    }
}
