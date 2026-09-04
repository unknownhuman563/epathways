<?php

namespace Tests\Feature\Immigration;

use App\Models\ResidentIntake;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Staff can edit an intake's form fields inline from the assessment modal, and
 * only whitelisted form fields are writable — internal columns (status, etc.)
 * can never be touched through this endpoint.
 */
class IntakeInlineEditTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_edit_a_form_field_but_not_internal_columns(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'immigration']));

        $intake = ResidentIntake::create([
            'intake_id' => 'RI-EDIT1', 'first_name' => 'Ed', 'last_name' => 'It',
            'dob' => '1998-01-18', 'nationality' => 'India',
            'email' => 'ed@example.com', 'phone' => '+64210000000', 'status' => 'Submitted',
            'passport_number' => 'P123', 'passport_expiry' => '2031-06-30', 'issuing_country' => 'India',
            'current_visa_type' => 'AEWV', 'current_visa_expiry' => '2027-03-31', 'nz_arrival_date' => '2022-02-15',
            'job_title' => 'Chef', 'employment_start' => '2022-03-01', 'employment_type' => 'Full-time', 'hourly_rate' => 32.5,
            'highest_qualification' => 'Bachelor', 'nz_skilled_years' => 2, 'total_skilled_years' => 5,
            'english_evidence' => 'IELTS', 'include_family' => 'No',
        ]);

        // Pick a non-date editable field straight from the live payload, so the
        // test doesn't hard-code the section schema.
        $data = $this->getJson("/portal/immigration/intakes/resident/{$intake->id}/data")->json();
        $field = collect($data['sections'])->flatMap(fn ($s) => $s['fields'])
            ->first(fn ($f) => ($f['editable'] ?? false)
                && ! preg_match('/^\d{4}-\d{2}-\d{2}/', (string) ($f['raw'] ?? ''))
                && ! str_contains((string) $f['key'], 'date')
                && $f['key'] !== 'dob');
        $this->assertNotNull($field, 'Expected at least one editable text field.');

        $this->patchJson("/portal/immigration/intakes/resident/{$intake->id}", [
            'fields' => [$field['key'] => 'Edited by staff', 'status' => 'Hacked'],
        ])->assertOk();

        $intake->refresh();
        $this->assertSame('Edited by staff', $intake->{$field['key']}); // whitelisted field saved
        $this->assertSame('Submitted', $intake->status);                // internal column untouched
    }
}
