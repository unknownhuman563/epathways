<?php

namespace Tests\Feature;

use App\Models\ResidentIntake;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ResidentIntakeUploadTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'terms_accepted'        => true,
            'first_name'            => 'Jane',
            'last_name'             => 'Doe',
            'dob'                   => '1990-01-01',
            'nationality'           => 'India',
            'email'                 => 'jane@example.com',
            'phone'                 => '+64211234567',
            'passport_number'       => 'A1234567',
            'passport_expiry'       => '2030-01-01',
            'issuing_country'       => 'India',
            'current_visa_type'     => 'AEWV',
            'current_visa_expiry'   => '2027-01-01',
            'nz_arrival_date'       => '2022-01-01',
            'job_title'             => 'Software Developer',
            'employment_start'      => '2022-02-01',
            'employment_type'       => 'Permanent full-time',
            'hourly_rate'           => '45.00',
            'highest_qualification' => 'bachelor',
            'nz_skilled_years'      => '2',
            'total_skilled_years'   => '7',
            'english_evidence'      => 'Passport (exempt country)',
            'include_family'        => 'No — applying alone',
            'documents'             => [
                'passport' => true, 'visa_copies' => false, 'contracts' => false,
                'payslips' => false, 'ird_summary' => false, 'education_certs' => false, 'cv' => false,
            ],
        ], $overrides);
    }

    public function test_uploaded_pdf_is_stored_and_referenced(): void
    {
        Storage::fake('local');

        $pdf = UploadedFile::fake()->create('passport.pdf', 200, 'application/pdf');

        $response = $this->post('/resident-interest', $this->payload([
            'document_files' => ['passport' => [$pdf]],
        ]));

        $response->assertSessionHas('success', true);
        $response->assertSessionHasNoErrors();

        $intake = ResidentIntake::firstOrFail();

        $this->assertIsArray($intake->document_files);
        $this->assertArrayHasKey('passport', $intake->document_files);
        $this->assertIsArray($intake->document_files['passport']);
        $this->assertCount(1, $intake->document_files['passport']);

        $path = $intake->document_files['passport'][0];
        Storage::disk('local')->assertExists($path);
        $this->assertStringContainsString("resident-intakes/{$intake->intake_id}", $path);
    }

    public function test_multiple_pdfs_per_key_and_other_bucket_are_stored(): void
    {
        Storage::fake('local');

        $a = UploadedFile::fake()->create('passport-a.pdf', 100, 'application/pdf');
        $b = UploadedFile::fake()->create('passport-b.pdf', 120, 'application/pdf');
        $other = UploadedFile::fake()->create('reference.pdf', 80, 'application/pdf');

        $response = $this->post('/resident-interest', $this->payload([
            'document_files' => [
                'passport' => [$a, $b],
                'other'    => [$other],
            ],
        ]));

        $response->assertSessionHas('success', true);
        $response->assertSessionHasNoErrors();

        $intake = ResidentIntake::firstOrFail();

        $this->assertCount(2, $intake->document_files['passport']);
        $this->assertCount(1, $intake->document_files['other']);

        foreach ($intake->document_files['passport'] as $p) {
            Storage::disk('local')->assertExists($p);
        }
        Storage::disk('local')->assertExists($intake->document_files['other'][0]);
    }

    public function test_submission_without_files_still_works(): void
    {
        Storage::fake('local');

        $response = $this->post('/resident-interest', $this->payload([
            'document_files' => [],
        ]));

        $response->assertSessionHas('success', true);
        $response->assertSessionHasNoErrors();

        $intake = ResidentIntake::firstOrFail();
        $this->assertNull($intake->document_files);
    }
}
