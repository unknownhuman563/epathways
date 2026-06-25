<?php

namespace Tests\Feature\Notifications;

use App\Models\Lead;
use App\Models\User;
use App\Notifications\DocumentSubmittedForReview;
use App\Notifications\TaskAssigned;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TaskAndDocumentNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_task_assigned_notifies_the_assignee_not_the_creator(): void
    {
        Notification::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $assignee = User::factory()->create(['role' => 'sales']);
        $lead = Lead::create(['first_name' => 'Task', 'last_name' => 'Lead']);

        $this->actingAs($admin)->post('/api/tasks', [
            'task_type'    => 'linked',
            'title'        => 'Follow up call',
            'lead_id'      => $lead->id,
            'due_at'       => now()->addDay()->toDateString(),
            'assignee_ids' => [$assignee->id],
        ])->assertSessionHasNoErrors()->assertRedirect();

        $this->assertDatabaseHas('lead_tasks', ['title' => 'Follow up call', 'assignee_id' => $assignee->id]);
        Notification::assertSentTo($assignee, TaskAssigned::class);
        Notification::assertNotSentTo($admin, TaskAssigned::class);
    }

    public function test_task_assigned_to_self_sends_nothing(): void
    {
        Notification::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $lead = Lead::create(['first_name' => 'Self', 'last_name' => 'Task']);

        $this->actingAs($admin)->post('/api/tasks', [
            'task_type'    => 'linked',
            'title'        => 'My own task',
            'lead_id'      => $lead->id,
            'due_at'       => now()->addDay()->toDateString(),
            'assignee_ids' => [$admin->id],
        ])->assertSessionHasNoErrors()->assertRedirect();

        Notification::assertNothingSent();
    }

    public function test_lead_task_from_detail_page_notifies_assignee(): void
    {
        Notification::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $assignee = User::factory()->create(['role' => 'education']);
        $lead = Lead::create(['first_name' => 'Tasked', 'last_name' => 'Lead']);

        $this->actingAs($admin)->post("/admin/leads/{$lead->id}/tasks", [
            'title'       => 'Chase documents',
            'assignee_id' => $assignee->id,
        ])->assertRedirect();

        Notification::assertSentTo($assignee, TaskAssigned::class);
    }

    public function test_lead_portal_upload_notifies_assigned_staff(): void
    {
        Notification::fake();
        Storage::fake('local');

        $staff = User::factory()->create(['role' => 'immigration']);
        $lead = Lead::create(['first_name' => 'Portal', 'last_name' => 'Lead', 'assigned_to' => $staff->id]);
        $leadUser = User::factory()->create(['role' => 'lead', 'lead_id' => $lead->id]);

        $this->actingAs($leadUser)->post('/portal/lead/documents/upload', [
            'file' => UploadedFile::fake()->create('passport.pdf', 100, 'application/pdf'),
        ])->assertRedirect();

        Notification::assertSentTo($staff, DocumentSubmittedForReview::class);
    }

    public function test_lead_portal_checklist_upload_notifies_once(): void
    {
        Notification::fake();
        Storage::fake('local');

        $admin = User::factory()->create(['role' => 'admin']);
        $lead = Lead::create(['first_name' => 'Check', 'last_name' => 'Lead']); // unassigned → admin fallback
        $leadUser = User::factory()->create(['role' => 'lead', 'lead_id' => $lead->id]);

        $this->actingAs($leadUser)->post('/portal/lead/documents/checklist/passport/upload', [
            'files' => [
                UploadedFile::fake()->create('p1.pdf', 100, 'application/pdf'),
                UploadedFile::fake()->create('p2.pdf', 100, 'application/pdf'),
            ],
        ])->assertRedirect();

        Notification::assertSentToTimes($admin, DocumentSubmittedForReview::class, 1);
    }
}
