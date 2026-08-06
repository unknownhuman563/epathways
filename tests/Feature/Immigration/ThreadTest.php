<?php

namespace Tests\Feature\Immigration;

use App\Models\CaseFinding;
use App\Models\CaseThread;
use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\User;
use App\Notifications\CaseThreadAddressed;
use App\Services\Immigration\CaseFindingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Build 12 phase 6 — anchored threads (§7). A thread anchors to something or it
 * doesn't get written; an answer-requiring thread addressed to someone lands in
 * their queue and notifies them; resolution is explicit and clears both.
 */
class ThreadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
    }

    private function caseLead(): Lead
    {
        return Lead::create([
            'first_name' => 'Aroha', 'last_name' => 'Ngata', 'email' => 'aroha@example.test',
            'is_immigration_case' => true, 'inz_visa_type' => 'Student Visa',
        ]);
    }

    private function staff(): User
    {
        return User::factory()->create(['role' => 'immigration']);
    }

    // ── A thread addressed to someone reaches their queue + notifies ─────────

    public function test_addressed_thread_appears_in_queue_and_notifies(): void
    {
        $case = $this->caseLead();
        $author = $this->staff();
        $addressee = $this->staff();

        $this->actingAs($author)
            ->post("/portal/immigration/cases/{$case->id}/threads", [
                'anchor_type' => 'case',
                'body' => 'Can you confirm the passport is current?',
                'addressed_to_id' => $addressee->id,
                'requires_answer' => true,
            ])
            ->assertRedirect();

        // The addressee is notified the same way a handoff notifies.
        Notification::assertSentTo($addressee, CaseThreadAddressed::class);

        // And the case shows up in their queue count, even though they don't own it.
        $this->assertSame(1, CaseThread::awaitingCountsFor($addressee->id)[$case->id] ?? 0);

        // The queue payload carries it for the viewing user.
        $this->actingAs($addressee)
            ->get('/portal/immigration/cases')
            ->assertInertia(fn ($page) => $page->where(
                'cases',
                fn ($cases) => collect($cases)->firstWhere('id', $case->id)['awaiting_my_answer'] === 1
            ));
    }

    // ── A document-anchored thread renders on that document, nowhere else ────

    public function test_document_anchored_thread_is_scoped_to_its_document(): void
    {
        $case = $this->caseLead();
        $author = $this->staff();
        $doc = LeadDocument::create([
            'lead_id' => $case->id, 'checklist_key' => 'police_cert',
            'original_name' => 'police.pdf', 'file_path' => 'x/police.pdf', 'status' => 'Submitted',
        ]);

        $this->actingAs($author)
            ->post("/portal/immigration/cases/{$case->id}/threads", [
                'anchor_type' => 'document',
                'anchor_id' => $doc->id,
                'body' => 'Is this the certified copy?',
            ])
            ->assertRedirect();

        $thread = CaseThread::where('lead_id', $case->id)->firstOrFail();
        $this->assertSame('document', $thread->anchor_type);
        $this->assertSame($doc->id, $thread->anchor_id);
        // It carries no case/gate/stage/step anchor — it belongs to the document
        // row alone, so the Notes tab's general list (case|gate|stage) excludes it.
        $this->assertNull($thread->anchor_key);
        $this->assertNotContains($thread->anchor_type, ['case', 'gate', 'stage', 'step']);

        // A document anchor must belong to THIS case (row-level).
        $other = $this->caseLead();
        $this->actingAs($author)
            ->post("/portal/immigration/cases/{$other->id}/threads", [
                'anchor_type' => 'document', 'anchor_id' => $doc->id, 'body' => 'x',
            ])
            ->assertStatus(422);
    }

    // ── Resolving clears the queue and lets the finding auto-resolve ─────────

    public function test_resolving_clears_queue_and_resolves_finding(): void
    {
        config(['immigration.findings.thread_unanswered_days' => 3]);
        $case = $this->caseLead();
        $author = $this->staff();
        $addressee = $this->staff();

        $thread = CaseThread::create([
            'lead_id' => $case->id, 'anchor_type' => 'case',
            'author_id' => $author->id, 'addressed_to_id' => $addressee->id,
            'body' => 'Please answer', 'requires_answer' => true,
        ]);
        // Age it past the threshold so the rule flags it.
        $thread->forceFill(['created_at' => now()->subDays(5)])->save();

        // In the queue, and a finding is raised.
        $this->assertSame(1, CaseThread::awaitingCountsFor($addressee->id)[$case->id] ?? 0);
        app(CaseFindingService::class)->evaluate($case);
        $finding = CaseFinding::where('lead_id', $case->id)
            ->where('finding_key', "thread_unanswered:{$thread->id}")->firstOrFail();
        $this->assertSame('open', $finding->status);
        // Audience follows the addressee (plain staff here).
        $this->assertSame('staff', $finding->audience);

        // Resolve it.
        $this->actingAs($author)
            ->post("/portal/immigration/cases/{$case->id}/threads/{$thread->id}/resolve")
            ->assertRedirect();

        // Gone from the queue …
        $this->assertSame(0, CaseThread::awaitingCountsFor($addressee->id)[$case->id] ?? 0);
        $this->assertNotNull($thread->fresh()->resolved_at);
        // … and the finding auto-resolves on the next run (no longer emitted).
        app(CaseFindingService::class)->evaluate($case);
        $this->assertSame('actioned', $finding->fresh()->status);
    }

    // ── Audience follows the addressee's role ────────────────────────────────

    public function test_finding_audience_is_adviser_when_addressed_to_the_adviser(): void
    {
        config(['immigration.findings.thread_unanswered_days' => 3]);
        $case = $this->caseLead();
        $author = $this->staff();
        $adviser = User::factory()->create(['role' => User::ROLE_IMMIGRATION_ADVISER]);

        $thread = CaseThread::create([
            'lead_id' => $case->id, 'anchor_type' => 'gate', 'anchor_key' => '12',
            'author_id' => $author->id, 'addressed_to_id' => $adviser->id,
            'body' => 'Ready to sign off?', 'requires_answer' => true,
        ]);
        $thread->forceFill(['created_at' => now()->subDays(5)])->save();

        app(CaseFindingService::class)->evaluate($case);
        $finding = CaseFinding::where('lead_id', $case->id)
            ->where('finding_key', "thread_unanswered:{$thread->id}")->firstOrFail();
        $this->assertSame('adviser', $finding->audience);
    }

    // ── An unanchored thread cannot be created ───────────────────────────────

    public function test_unanchored_thread_cannot_be_created(): void
    {
        $case = $this->caseLead();
        $author = $this->staff();

        // No anchor_type at all.
        $this->actingAs($author)
            ->post("/portal/immigration/cases/{$case->id}/threads", ['body' => 'floating message'])
            ->assertSessionHasErrors('anchor_type');

        // A step anchor without its key.
        $this->actingAs($author)
            ->post("/portal/immigration/cases/{$case->id}/threads", ['anchor_type' => 'step', 'body' => 'x'])
            ->assertSessionHasErrors('anchor_key');

        // A document anchor without its id.
        $this->actingAs($author)
            ->post("/portal/immigration/cases/{$case->id}/threads", ['anchor_type' => 'document', 'body' => 'x'])
            ->assertSessionHasErrors('anchor_id');

        $this->assertDatabaseCount('case_threads', 0);
    }
}
