<?php

namespace Tests\Feature\Immigration;

use App\Models\WorkIntake;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * The AEWV "Work Interest & Qualifications" document tab must persist uploaded
 * files to the private disk (keyed in document_files) and the PCC answer in
 * documents — mirroring the Resident intake pattern.
 */
class WorkIntakeDocumentsTest extends TestCase
{
    use RefreshDatabase;

    public function test_work_intake_stores_documents_and_files_on_the_private_disk(): void
    {
        Storage::fake('local');

        $payload = [
            'family_name' => 'Cardiff', 'first_name' => 'Kevin',
            'dob' => '1990-01-01', 'email' => 'kevin@example.com', 'phone' => '+64211234567',
            'declaration_accepted' => true,
            'documents' => ['valid_pcc' => 'Yes'],
            'document_files' => [
                'passport' => [UploadedFile::fake()->create('passport.pdf', 100, 'application/pdf')],
                'ird_earnings' => [UploadedFile::fake()->create('ird.pdf', 80, 'application/pdf')],
                // An unknown key must be ignored, never stored.
                'not_a_real_key' => [UploadedFile::fake()->create('evil.pdf', 10, 'application/pdf')],
            ],
        ];

        $this->post('/work-interest', $payload)->assertSessionHasNoErrors()->assertRedirect();

        $intake = WorkIntake::firstOrFail();

        // PCC answer captured.
        $this->assertSame('Yes', $intake->documents['valid_pcc'] ?? null);

        // Known files stored under document_files, keyed; unknown key dropped.
        $files = $intake->document_files;
        $this->assertArrayHasKey('passport', $files);
        $this->assertArrayHasKey('ird_earnings', $files);
        $this->assertArrayNotHasKey('not_a_real_key', $files);

        // The stored path is on the private disk under the intake's folder.
        $path = $files['passport'][0];
        $this->assertStringContainsString("work-intakes/{$intake->intake_id}", $path);
        Storage::disk('local')->assertExists($path);
    }
}
