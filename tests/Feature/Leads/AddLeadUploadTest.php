<?php

namespace Tests\Feature\Leads;

use App\Models\LeadDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AddLeadUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_add_lead_stores_uploaded_documents_under_canonical_keys(): void
    {
        Storage::fake('local');
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->post('/admin/leads', [
            'first_name' => 'Doc',
            'last_name' => 'Tester',
            'cv_files' => [UploadedFile::fake()->create('cv.pdf', 20, 'application/pdf')],
            'passport_files' => [UploadedFile::fake()->create('passport.pdf', 20, 'application/pdf')],
            'diploma_files' => [UploadedFile::fake()->create('diploma.pdf', 20, 'application/pdf')],
            'transcript_files' => [UploadedFile::fake()->create('tor.pdf', 20, 'application/pdf')],
        ])->assertRedirect();

        $keys = LeadDocument::pluck('checklist_key')->all();
        $this->assertContains('acad.cv', $keys);
        $this->assertContains('pers.passport', $keys);
        $this->assertContains('acad.degree_diploma', $keys);
        $this->assertContains('acad.transcript', $keys);
        $this->assertCount(4, $keys);

        // Files actually landed on the private disk.
        foreach (LeadDocument::all() as $doc) {
            Storage::disk('local')->assertExists($doc->file_path);
        }
    }

    public function test_education_add_lead_stores_uploaded_documents(): void
    {
        Storage::fake('local');
        $edu = User::factory()->create(['role' => 'education']);

        $this->actingAs($edu)->post('/portal/education/leads', [
            'first_name' => 'Edu',
            'cv_files' => [UploadedFile::fake()->create('cv.pdf', 10, 'application/pdf')],
        ])->assertRedirect();

        $this->assertSame('acad.cv', LeadDocument::sole()->checklist_key);
    }
}
