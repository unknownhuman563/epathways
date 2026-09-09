<?php

namespace Tests\Feature\Immigration;

use App\Mail\TemplatedMessage;
use App\Models\EmailAutomationMessage;
use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\MessageTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Moving a case to "Request for Information" opens a modal that captures a
 * response deadline + RFI PDF(s) and fires the RFI stage automation with the
 * PDF attached. This covers the endpoint behind it.
 */
class RequestForInformationTest extends TestCase
{
    use RefreshDatabase;

    private function case(): Lead
    {
        return Lead::create([
            'first_name' => 'Test', 'last_name' => 'Sample', 'email' => 'client@example.com',
            'is_immigration_case' => true, 'immigration_stage' => 'Endorsed', 'status' => 'Engaged',
        ]);
    }

    private function actAsStaff(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'immigration']));
    }

    public function test_rfi_moves_stage_saves_deadline_and_shares_the_pdf(): void
    {
        Storage::fake('local');
        $this->actAsStaff();
        $case = $this->case();

        $this->post("/portal/immigration/cases/{$case->id}/rfi", [
            'deadline' => '2026-10-01',
            'note' => 'Please send updated payslips.',
            'notify' => 0,
            'documents' => [UploadedFile::fake()->create('rfi-letter.pdf', 120, 'application/pdf')],
        ])->assertSessionHasNoErrors();

        $case->refresh();
        $this->assertSame('Request for Information', $case->immigration_stage);
        $this->assertSame('2026-10-01', $case->rfi_deadline->toDateString());

        $doc = LeadDocument::where('lead_id', $case->id)->where('source_variant', 'rfi')->first();
        $this->assertNotNull($doc);
        $this->assertSame(LeadDocument::STATUS_STAFF_SHARED, $doc->status);
        Storage::disk('local')->assertExists($doc->file_path);

        // The note (with the deadline) is on the timeline.
        $this->assertDatabaseHas('lead_notes', ['lead_id' => $case->id]);
    }

    public function test_rfi_email_automation_attaches_the_pdf(): void
    {
        Storage::fake('local');
        Mail::fake();
        $this->actAsStaff();
        $case = $this->case();

        // A client RFI automation is configured (admin-managed in real life).
        MessageTemplate::create([
            'key' => 'rfi.tpl', 'department' => 'immigration', 'name' => 'RFI', 'channels' => ['email'],
            'email_subject' => 'Info needed by {{rfi_deadline}}', 'email_body' => 'Please respond by {{rfi_deadline}}.',
            'is_active' => true,
        ]);
        EmailAutomationMessage::create([
            'event_key' => 'immigration.stage.request_for_information',
            'recipient' => 'client', 'template_key' => 'rfi.tpl', 'channel' => 'email', 'enabled' => true,
        ]);

        $this->post("/portal/immigration/cases/{$case->id}/rfi", [
            'deadline' => '2026-10-01', 'notify' => 1,
            'documents' => [UploadedFile::fake()->create('rfi-letter.pdf', 120, 'application/pdf')],
        ])->assertSessionHasNoErrors();

        // TemplatedMessage is queued (ShouldQueue).
        Mail::assertQueued(TemplatedMessage::class, function (TemplatedMessage $m) {
            return count($m->attachmentFiles) === 1
                && $m->attachmentFiles[0]['name'] === 'rfi-letter.pdf';
        });
    }

    public function test_notify_with_no_automation_configured_is_a_safe_noop(): void
    {
        Storage::fake('local');
        Mail::fake();
        $this->actAsStaff();
        $case = $this->case();

        // notify on, but nothing configured — must still move the stage, no error.
        $this->post("/portal/immigration/cases/{$case->id}/rfi", [
            'deadline' => '2026-10-01', 'notify' => 1,
        ])->assertSessionHasNoErrors();

        $case->refresh();
        $this->assertSame('Request for Information', $case->immigration_stage);
        Mail::assertNothingSent();
    }

    public function test_deadline_is_required(): void
    {
        $this->actAsStaff();
        $case = $this->case();

        $this->post("/portal/immigration/cases/{$case->id}/rfi", ['notify' => 0])
            ->assertSessionHasErrors('deadline');
    }
}
