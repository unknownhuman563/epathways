<?php

namespace Tests\Feature\Immigration;

use App\Models\User;
use App\Models\WorkIntake;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * The assessment modal's Documents tab must list the applicant's uploaded files
 * with a working, viewable URL — the file streams from the private disk.
 */
class IntakeDocumentsViewTest extends TestCase
{
    use RefreshDatabase;

    public function test_documents_are_listed_and_viewable(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('work-intakes/WI-1/passport/p.pdf', '%PDF-1.4 fake');

        $this->actingAs(User::factory()->create(['role' => 'immigration']));

        $intake = WorkIntake::create([
            'intake_id' => 'WI-1', 'family_name' => 'Doc', 'first_name' => 'View',
            'dob' => '1990-01-01', 'email' => 'doc@example.com', 'phone' => '+64210000000',
            'status' => 'Submitted',
            'document_files' => ['passport' => ['work-intakes/WI-1/passport/p.pdf']],
        ]);

        // Payload lists the document with a viewable URL.
        $data = $this->getJson("/portal/immigration/intakes/work/{$intake->id}/data")->json();
        $this->assertNotEmpty($data['documents']);
        $this->assertSame(1, $data['documents_count']);
        $doc = $data['documents'][0];
        $this->assertSame('Passport (all pages)', $doc['label']);
        $this->assertStringContainsString('/documents/passport/0', $doc['url']);

        // The URL actually streams the file (viewable, not a 404).
        $this->get($doc['url'])->assertOk();
    }
}
