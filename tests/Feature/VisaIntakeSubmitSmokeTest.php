<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * "Nothing happens when I submit" — prove each public visa intake actually
 * accepts a valid submission end to end: no 500, no silent 422, and the
 * `intake_submitted` flash the success modal waits on is set. Also covers the
 * silent server-side draft endpoint the forms auto-save to.
 */
class VisaIntakeSubmitSmokeTest extends TestCase
{
    use RefreshDatabase;

    private function base(): array
    {
        return [
            'first_name' => 'Ana', 'family_name' => 'Cruz', 'last_name' => 'Cruz',
            'dob' => '1992-04-11', 'email' => 'ana.cruz@example.test', 'phone' => '+64 21 555 0000',
        ];
    }

    public function test_work_intake_submits(): void
    {
        $res = $this->post('/work-interest', $this->base() + ['declaration_accepted' => true]);

        $res->assertSessionHasNoErrors();
        $res->assertRedirect();
        $this->assertSame('Work Visa (AEWV)', session('intake_submitted'));
    }

    public function test_student_intake_submits(): void
    {
        // Student + Visitor additionally require an accepted declaration.
        $res = $this->post('/student-interest', $this->base() + ['declaration_accepted' => true]);

        $res->assertSessionHasNoErrors();
        $this->assertSame('Student Visa', session('intake_submitted'));
    }

    public function test_visitor_intake_submits(): void
    {
        $res = $this->post('/visitor-interest', $this->base() + ['declaration_accepted' => true]);

        $res->assertSessionHasNoErrors();
        $this->assertSame('Visitor Visa (GVV)', session('intake_submitted'));
    }

    public function test_family_intake_submits(): void
    {
        $res = $this->post('/family-interest', $this->base());

        $res->assertSessionHasNoErrors();
        $this->assertSame('Family Visa (Partner / Child)', session('intake_submitted'));
    }

    public function test_resident_intake_submits(): void
    {
        $payload = $this->base() + [
            'terms_accepted' => true,
            'nationality' => 'Filipino',
            'passport_number' => 'P1234567', 'passport_expiry' => '2031-01-01', 'issuing_country' => 'Philippines',
            'current_visa_type' => 'AEWV', 'current_visa_expiry' => '2027-01-01', 'nz_arrival_date' => '2023-06-01',
            'job_title' => 'Chef', 'employment_start' => '2023-07-01', 'employment_type' => 'Full-time', 'hourly_rate' => 32.5,
            'highest_qualification' => "Bachelor's Degree",
            'nz_skilled_years' => 2, 'total_skilled_years' => 5,
            'english_evidence' => 'Recognised employment', 'include_family' => 'No',
        ];

        $res = $this->post('/resident-interest', $payload);

        $res->assertSessionHasNoErrors();
        $res->assertRedirect();
    }

    /** @dataProvider draftVisas */
    public function test_draft_endpoint_saves(string $visa): void
    {
        $res = $this->postJson("/visa-interest/{$visa}/draft", [
            'first_name' => 'Ana', 'email' => 'ana.draft@example.test',
        ]);

        $res->assertOk();
        $res->assertJson(['draft_saved' => true]);
    }

    public static function draftVisas(): array
    {
        return [['resident'], ['work'], ['student'], ['visitor'], ['family']];
    }
}
