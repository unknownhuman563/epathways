<?php

namespace Tests\Feature\Track;

use App\Mail\DocumentStatusChanged;
use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DocumentQueueTest extends TestCase
{
    use RefreshDatabase;

    private function staff(string $role = 'admin'): User
    {
        return User::factory()->create(['role' => $role]);
    }

    private function doc(Lead $lead, string $status = LeadDocument::STATUS_SUBMITTED, array $attrs = []): LeadDocument
    {
        return LeadDocument::create(array_merge([
            'lead_id' => $lead->id, 'original_name' => 'scan.pdf', 'file_path' => 'lead-documents/scan.pdf',
            'mime' => 'application/pdf', 'size' => 100, 'status' => $status, 'source' => LeadDocument::SOURCE_UPLOAD,
        ], $attrs));
    }

    private function lead(array $attrs = []): Lead
    {
        return Lead::create(array_merge(['first_name' => 'Doc', 'last_name' => 'Lead', 'email' => 'doc@example.com'], $attrs));
    }

    public function test_queue_renders_for_staff(): void
    {
        $lead = $this->lead();
        $this->doc($lead);

        $this->actingAs($this->staff())
            ->get('/admin/document-queue')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('admin/DocumentQueue')->has('documents.data', 1));
    }

    public function test_pending_filter_excludes_approved_and_rejected(): void
    {
        $lead = $this->lead();
        $this->doc($lead, LeadDocument::STATUS_SUBMITTED);
        $this->doc($lead, LeadDocument::STATUS_APPROVED);
        $this->doc($lead, LeadDocument::STATUS_REJECTED);

        $this->actingAs($this->staff())
            ->get('/admin/document-queue') // default = pending
            ->assertInertia(fn (Assert $p) => $p->has('documents.data', 1));
    }

    public function test_bulk_approve_works_end_to_end(): void
    {
        Mail::fake();
        $lead = $this->lead();
        $doc = $this->doc($lead);

        $this->actingAs($this->staff())
            ->post('/admin/document-queue/bulk', ['ids' => [$doc->id], 'action' => 'approve'])
            ->assertRedirect();

        $this->assertSame(LeadDocument::STATUS_APPROVED, $doc->fresh()->status);
        Mail::assertQueued(DocumentStatusChanged::class, fn ($m) => $m->hasTo('doc@example.com'));
    }

    public function test_bulk_reject_with_reason_works(): void
    {
        Mail::fake();
        $lead = $this->lead();
        $doc = $this->doc($lead);

        $this->actingAs($this->staff())
            ->post('/admin/document-queue/bulk', ['ids' => [$doc->id], 'action' => 'reject', 'reason' => 'Illegible'])
            ->assertRedirect();

        $doc->refresh();
        $this->assertSame(LeadDocument::STATUS_REJECTED, $doc->status);
        $this->assertSame('Illegible', $doc->note);
    }

    public function test_bulk_approve_handles_many_in_one_request(): void
    {
        Mail::fake();
        $lead = $this->lead();
        $ids = collect(range(1, 12))->map(fn () => $this->doc($lead)->id)->all();

        $this->actingAs($this->staff())
            ->post('/admin/document-queue/bulk', ['ids' => $ids, 'action' => 'approve'])
            ->assertRedirect();

        $this->assertSame(0, LeadDocument::whereIn('id', $ids)->where('status', '!=', LeadDocument::STATUS_APPROVED)->count());
    }

    public function test_search_filter_narrows_by_lead(): void
    {
        $a = $this->lead(['first_name' => 'Zenith', 'last_name' => 'Aye']);
        $b = $this->lead(['first_name' => 'Other', 'last_name' => 'Bee']);
        $this->doc($a);
        $this->doc($b);

        $this->actingAs($this->staff())
            ->get('/admin/document-queue?search=Zenith')
            ->assertInertia(fn (Assert $p) => $p->has('documents.data', 1)->where('documents.data.0.lead_name', 'Zenith Aye'));
    }

    public function test_non_staff_role_gets_403(): void
    {
        $lead = User::factory()->create(['role' => 'lead']);

        $this->actingAs($lead)->get('/admin/document-queue')->assertForbidden();
        $this->actingAs($lead)->post('/admin/document-queue/bulk', ['ids' => [1], 'action' => 'approve'])->assertForbidden();
    }
}
