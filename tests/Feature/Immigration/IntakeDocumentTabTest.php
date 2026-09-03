<?php

namespace Tests\Feature\Immigration;

use App\Models\StudentIntake;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * The shared document tab on the Student / Visitor / Family intakes stores files
 * on the private disk (keyed in document_files), and the assessment module can
 * stream them back through the generic intake-document route.
 */
class IntakeDocumentTabTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_intake_stores_documents_on_the_private_disk(): void
    {
        Storage::fake('local');

        $this->post('/student-interest', [
            'family_name' => 'Cardiff', 'first_name' => 'Kevin',
            'dob' => '1990-01-01', 'email' => 'kevin@example.com', 'phone' => '+64211234567',
            'declaration_accepted' => true,
            'documents' => ['passport' => true],
            'document_files' => [
                'passport' => [UploadedFile::fake()->create('passport.pdf', 100, 'application/pdf')],
                'bogus_key' => [UploadedFile::fake()->create('x.pdf', 10, 'application/pdf')],
            ],
        ])->assertSessionHasNoErrors()->assertRedirect();

        $intake = StudentIntake::firstOrFail();
        $files = $intake->document_files;

        $this->assertArrayHasKey('passport', $files);
        $this->assertArrayNotHasKey('bogus_key', $files); // unknown keys ignored
        $this->assertStringContainsString("student-intakes/{$intake->intake_id}", $files['passport'][0]);
        Storage::disk('local')->assertExists($files['passport'][0]);
    }

    public function test_staff_can_stream_an_intake_document_via_the_generic_route(): void
    {
        Storage::fake('local');
        $staff = User::factory()->create(['role' => 'immigration']);

        $intake = StudentIntake::create([
            'intake_id' => 'SI-TEST', 'status' => 'Submitted',
            'family_name' => 'Cardiff', 'first_name' => 'Kevin',
            'dob' => '1990-01-01', 'email' => 'kevin@example.com', 'phone' => '021',
            'document_files' => ['passport' => [
                UploadedFile::fake()->create('p.pdf', 20, 'application/pdf')->store('student-intakes/SI-TEST', 'local'),
            ]],
        ]);

        $this->actingAs($staff)
            ->get("/admin/immigration/intakes/student/{$intake->id}/documents/passport/0")
            ->assertOk();

        // An unknown type / key 404s rather than leaking.
        $this->actingAs($staff)
            ->get("/admin/immigration/intakes/student/{$intake->id}/documents/not_a_key/0")
            ->assertNotFound();
    }
}
