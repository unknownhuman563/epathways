<?php

namespace Tests\Feature\Notifications;

use App\Models\Lead;
use App\Models\User;
use App\Notifications\DocumentSubmittedForReview;
use App\Notifications\LeadAssignedToYou;
use App\Support\NotificationFormatter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class NotificationTypesTest extends TestCase
{
    use RefreshDatabase;

    public function test_lead_assigned_fires_when_assigned_to_changes(): void
    {
        Notification::fake();

        $staff = User::factory()->create(['role' => 'sales']);
        $actor = User::factory()->create(['role' => 'admin']);
        $lead = Lead::create(['first_name' => 'New', 'last_name' => 'Lead']);

        $this->actingAs($actor);
        $lead->update(['assigned_to' => $staff->id]);

        Notification::assertSentTo($staff, LeadAssignedToYou::class, function ($n) use ($actor) {
            $data = $n->toArray($n);
            return $data['assigned_by_name'] === $actor->name;
        });
    }

    public function test_lead_assigned_does_not_fire_on_unrelated_change(): void
    {
        Notification::fake();

        $lead = Lead::create(['first_name' => 'New', 'last_name' => 'Lead']);
        $lead->update(['first_name' => 'Renamed']); // not an assignment

        Notification::assertNothingSent();
    }

    public function test_lead_assigned_does_not_fire_on_unassignment(): void
    {
        $staff = User::factory()->create(['role' => 'sales']);
        $lead = Lead::create(['first_name' => 'New', 'last_name' => 'Lead', 'assigned_to' => $staff->id]);

        Notification::fake(); // start faking AFTER the initial assignment
        $lead->update(['assigned_to' => null]);

        Notification::assertNothingSent();
    }

    public function test_document_submitted_notifies_assigned_staff_not_the_lead(): void
    {
        Notification::fake();
        Storage::fake('public');

        $staff = User::factory()->create(['role' => 'sales']);
        $lead = Lead::create([
            'first_name'  => 'Track',
            'last_name'   => 'Lead',
            'assigned_to' => $staff->id,
        ]);

        $this->post("/track/{$lead->tracking_code}/document", [
            'file' => UploadedFile::fake()->create('passport.pdf', 100, 'application/pdf'),
            'checklist_key' => 'passport',
        ])->assertRedirect();

        Notification::assertSentTo($staff, DocumentSubmittedForReview::class);
    }

    public function test_document_submitted_noop_when_lead_unassigned(): void
    {
        Notification::fake();
        Storage::fake('public');

        $lead = Lead::create(['first_name' => 'Track', 'last_name' => 'Lead']); // no assigned_to

        $this->post("/track/{$lead->tracking_code}/document", [
            'file' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
        ])->assertRedirect();

        Notification::assertNothingSent();
    }

    public function test_formatter_maps_known_types(): void
    {
        $assigned = NotificationFormatter::format([
            'type' => 'App\\Notifications\\LeadAssignedToYou',
            'data' => ['title' => 'Lead assigned to you', 'body' => 'X assigned Y to you.', 'link' => '/admin/leads/5'],
        ]);
        $this->assertSame('LeadAssignedToYou', $assigned['type']);
        $this->assertSame('UserPlus', $assigned['icon']);
        $this->assertSame('/admin/leads/5', $assigned['url']);
        $this->assertSame('X assigned Y to you.', $assigned['body']);

        $doc = NotificationFormatter::format([
            'type' => 'App\\Notifications\\DocumentSubmittedForReview',
            'data' => ['title' => 'Document submitted for review', 'body' => 'Uploaded'],
        ]);
        $this->assertSame('FileText', $doc['icon']);

        $price = NotificationFormatter::format([
            'type' => 'App\\Notifications\\VisaTypePriceChanged',
            'data' => ['title' => 'Visa pricing updated', 'body' => 'Changed', 'link' => '/portal/immigration/visa-types'],
        ]);
        $this->assertSame('DollarSign', $price['icon']);
        $this->assertSame('/portal/immigration/visa-types', $price['url']);
    }

    public function test_formatter_handles_unknown_type_gracefully(): void
    {
        $out = NotificationFormatter::format([
            'type' => 'App\\Notifications\\SomethingNew',
            'data' => ['foo' => 'bar'],
        ]);

        $this->assertSame('SomethingNew', $out['type']);
        $this->assertSame('Bell', $out['icon']);
        $this->assertSame('Something New', $out['title']); // humanized
        $this->assertNull($out['url']);
        $this->assertStringContainsString('foo', $out['body']);
    }
}
