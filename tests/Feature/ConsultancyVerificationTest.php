<?php

namespace Tests\Feature;

use App\Mail\TemplatedMessage;
use App\Models\Lead;
use App\Models\MessageTemplate;
use App\Models\User;
use App\Services\ConsultancyReviewService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Consultancy Agreement Verification — fee line-item snapshot, per-item edit +
 * status, verify → approve (which emails the client), and request-changes.
 */
class ConsultancyVerificationTest extends TestCase
{
    use RefreshDatabase;

    private function reviewer(): User
    {
        return User::factory()->create(['role' => 'super_admin']);
    }

    private function submitted(string $type = 'consultancy_english_100', array $overrides = []): Lead
    {
        $lead = Lead::create(['first_name' => 'Emma', 'last_name' => 'Thompson', 'email' => 'emma@example.com']);
        ConsultancyReviewService::submit($lead, $type, $overrides, null);

        return $lead->refresh();
    }

    public function test_submit_snapshots_fee_items_and_sets_pending(): void
    {
        $lead = $this->submitted('consultancy_english_100', ['school_enrolment_fee' => 120000]);

        $this->assertSame('pending', $lead->consultancy_review['status']);
        $this->assertSame(['school_enrolment', 'english_proficiency'], $lead->consultancy_review['item_keys']);
        $this->assertSame(120000, $lead->consultancy_review['items']['school_enrolment']['amount']);
        $this->assertSame(14500, $lead->consultancy_review['items']['english_proficiency']['amount']);
        $this->assertSame('needs_check', $lead->consultancy_review['items']['school_enrolment']['status']);
    }

    public function test_index_returns_queue_with_items(): void
    {
        $this->submitted();

        $this->actingAs($this->reviewer())
            ->get('/consultancy-verification')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->component('admin/ConsultancyVerification')
                ->where('counts.pending', 1)
                ->has('proposals.0', fn (Assert $r) => $r
                    ->where('name', 'Emma Thompson')
                    ->where('items_count', 2)
                    ->has('items.0', fn (Assert $it) => $it->where('key', 'school_enrolment')->etc())
                    ->etc()
                )
            );
    }

    public function test_update_meta_edits_amount_and_marks_verified(): void
    {
        $lead = $this->submitted('consultancy_std_100');

        $this->actingAs($this->reviewer())
            ->post("/consultancy-verification/{$lead->id}/meta", [
                'meta' => ['school_enrolment' => ['amount' => 99000, 'status' => 'verified']],
            ])->assertRedirect();

        $m = $lead->refresh()->consultancy_review['items']['school_enrolment'];
        $this->assertSame(99000, $m['amount']);
        $this->assertSame('verified', $m['status']);
        $this->assertTrue($m['edited']);
    }

    public function test_verify_then_approve_emails_the_client(): void
    {
        Mail::fake();
        MessageTemplate::create([
            'key' => 'consultancy_agreement', 'department' => '', 'name' => 'Consultancy',
            'channels' => ['email'], 'email_subject' => 'Your agreement {{first_name}}',
            'email_body' => 'Attached.', 'is_active' => true,
        ]);
        $lead = $this->submitted('consultancy_std_100');
        $reviewer = $this->reviewer();

        $this->actingAs($reviewer)->post("/consultancy-verification/{$lead->id}/verify")->assertRedirect();
        $this->assertSame('verified', $lead->refresh()->consultancy_review['status']);

        $this->actingAs($reviewer)->post("/consultancy-verification/{$lead->id}/approve", ['send_email' => 1])->assertRedirect();
        $this->assertSame('approved', $lead->refresh()->consultancy_review['status']);
        Mail::assertQueued(TemplatedMessage::class, fn ($m) => $m->hasTo('emma@example.com'));
    }

    public function test_verify_all_confirms_every_item(): void
    {
        $lead = $this->submitted('consultancy_english_100');

        $this->actingAs($this->reviewer())
            ->post("/consultancy-verification/{$lead->id}/approve", ['verify_all' => 1, 'send_email' => 0])
            ->assertRedirect();

        $lead->refresh();
        $this->assertSame('approved', $lead->consultancy_review['status']);
        foreach (['school_enrolment', 'english_proficiency'] as $k) {
            $this->assertSame('verified', $lead->consultancy_review['items'][$k]['status']);
        }
    }

    public function test_request_changes_flags_items_and_adds_a_note(): void
    {
        $lead = $this->submitted('consultancy_english_100');

        $this->actingAs($this->reviewer())
            ->post("/consultancy-verification/{$lead->id}/request-changes", [
                'message' => 'Fix the English fee', 'item_keys' => ['english_proficiency', 'bogus'],
            ])->assertRedirect();

        $review = $lead->refresh()->consultancy_review;
        $this->assertSame('pending', $review['status']);
        $this->assertSame(['english_proficiency'], $review['changes_requested']['item_keys']);
        $notes = $lead->consultancy_review['items']['english_proficiency']['notes'];
        $this->assertCount(1, $notes);
        $this->assertSame('change_requested', $notes[0]['tag']);
    }

    public function test_notes_add_reply_and_actioned(): void
    {
        $lead = $this->submitted('consultancy_std_100');
        $reviewer = $this->reviewer();

        $this->actingAs($reviewer)->post("/consultancy-verification/{$lead->id}/notes/school_enrolment", ['body' => 'Confirm with finance'])->assertRedirect();
        $noteId = $lead->refresh()->consultancy_review['items']['school_enrolment']['notes'][0]['id'];

        $this->actingAs($reviewer)->post("/consultancy-verification/{$lead->id}/notes/school_enrolment/{$noteId}/reply", ['body' => 'Done'])->assertRedirect();
        $this->actingAs($reviewer)->post("/consultancy-verification/{$lead->id}/notes/school_enrolment/{$noteId}/actioned")->assertRedirect();

        $note = $lead->refresh()->consultancy_review['items']['school_enrolment']['notes'][0];
        $this->assertCount(1, $note['replies']);
        $this->assertNotNull($note['actioned_at']);
    }

    public function test_note_on_unknown_item_is_rejected(): void
    {
        $lead = $this->submitted('consultancy_std_100');

        $this->actingAs($this->reviewer())
            ->post("/consultancy-verification/{$lead->id}/notes/nope", ['body' => 'x'])
            ->assertNotFound();
    }

    public function test_preview_renders_html_without_a_generated_pdf(): void
    {
        $lead = $this->submitted('consultancy_std_150', ['school_enrolment_fee' => 150000]);

        // No document is generated at submit time.
        $this->assertDatabaseMissing('lead_documents', ['lead_id' => $lead->id, 'checklist_key' => 'agree.consultancy']);

        $res = $this->actingAs($this->reviewer())->get("/consultancy-verification/{$lead->id}/preview");
        $res->assertOk();
        $this->assertStringContainsStringIgnoringCase('agreement', $res->getContent());
    }

    public function test_approve_fires_the_consultancy_approved_automation_and_ccs_agent(): void
    {
        Mail::fake();
        $agent = User::factory()->create(['role' => 'agent', 'name' => 'Aggie', 'email' => 'aggie@agency.com']);
        MessageTemplate::create([
            'key' => 'consultancy_client_notice', 'department' => 'education', 'name' => 'Client notice',
            'channels' => ['email'], 'email_subject' => 'Approved {{first_name}}', 'email_body' => 'Your agreement is ready.', 'is_active' => true,
        ]);
        \App\Models\EmailAutomationMessage::create([
            'event_key' => 'education.consultancy.approved', 'recipient' => 'client',
            'template_key' => 'consultancy_client_notice', 'channel' => 'email',
            'enabled' => true, 'cc_agent' => true, 'sort_order' => 0,
        ]);

        $lead = $this->submitted('consultancy_std_100');
        $lead->update(['agent_id' => $agent->id]);

        $this->actingAs($this->reviewer())
            ->post("/consultancy-verification/{$lead->id}/approve", ['verify_all' => 1, 'send_email' => 1])
            ->assertRedirect();

        Mail::assertQueued(\App\Mail\TemplatedMessage::class, fn ($m) => $m->hasTo('emma@example.com')
            && str_contains((string) $m->ccList, 'aggie@agency.com')
            && str_contains($m->subjectLine, 'Approved'));
    }

    public function test_draft_moves_a_verified_agreement_back_to_pending(): void
    {
        $lead = $this->submitted('consultancy_std_100');
        $reviewer = $this->reviewer();

        $this->actingAs($reviewer)->post("/consultancy-verification/{$lead->id}/verify")->assertRedirect();
        $this->assertSame('verified', $lead->refresh()->consultancy_review['status']);

        $this->actingAs($reviewer)->post("/consultancy-verification/{$lead->id}/draft")->assertRedirect();
        $review = $lead->refresh()->consultancy_review;
        $this->assertSame('pending', $review['status']);
        $this->assertArrayNotHasKey('verified_at', $review);
    }
}
