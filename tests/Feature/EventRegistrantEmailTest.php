<?php

namespace Tests\Feature;

use App\Mail\TemplatedMessage;
use App\Models\Event;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class EventRegistrantEmailTest extends TestCase
{
    use RefreshDatabase;

    private function event(): Event
    {
        return Event::create([
            'name' => 'Canada Fair', 'type' => 'Fair', 'status' => 'upcoming', 'mode' => 'in-person',
            'location' => 'SMX', 'event_code' => 'canada-fair-x', 'date_from' => now()->addDays(10)->toDateString(),
            'time_start' => '10:00', 'time_end' => '16:00',
        ]);
    }

    private function registrant(Event $event, array $o = []): Lead
    {
        return Lead::create(array_merge([
            'lead_id' => 'LP-'.rand(1000, 9999), 'first_name' => 'Neil', 'last_name' => 'Santos',
            'email' => 'neil'.rand(1, 9999).'@example.com', 'event_id' => $event->id, 'status' => 'New Leads',
        ], $o));
    }

    public function test_sends_email_to_selected_registrants(): void
    {
        Mail::fake();
        $event = $this->event();
        $a = $this->registrant($event);
        $b = $this->registrant($event);
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->from("/admin/events/{$event->id}")
            ->post("/admin/events/{$event->id}/email", [
                'subject' => 'See you at {{event_name}}!',
                'body' => '<p>Hi {{first_name}}, the event is on {{event_date}}.</p>',
                'recipient_ids' => [$a->id, $b->id],
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        Mail::assertQueued(TemplatedMessage::class, 2);
        // Subject variable substituted per lead.
        Mail::assertQueued(TemplatedMessage::class, fn ($m) => str_contains($m->subjectLine, 'Canada Fair'));
    }

    public function test_ignores_ids_not_belonging_to_this_event(): void
    {
        Mail::fake();
        $event = $this->event();
        $mine = $this->registrant($event);
        $other = Lead::create(['lead_id' => 'LP-OTHER', 'first_name' => 'X', 'last_name' => 'Y', 'email' => 'x@example.com']);
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->from("/admin/events/{$event->id}")
            ->post("/admin/events/{$event->id}/email", [
                'subject' => 'Hi', 'body' => '<p>Hello</p>',
                'recipient_ids' => [$mine->id, $other->id],
            ])->assertRedirect();

        // Only the real registrant gets the email.
        Mail::assertQueued(TemplatedMessage::class, 1);
    }

    public function test_uses_selected_template_banner_and_footer(): void
    {
        Mail::fake();
        $event = $this->event();
        $lead = $this->registrant($event);
        $admin = User::factory()->create(['role' => 'admin']);

        $template = \App\Models\MessageTemplate::create([
            'key' => 'evt_brand', 'name' => 'Branded', 'department' => '', 'channels' => ['email'],
            'email_subject' => 'Hi', 'email_body' => '<p>x</p>', 'is_active' => true,
            'banner_image' => 'templates/banners/custom.png',
            'footer_image' => 'templates/footers/custom.png',
        ]);

        $this->actingAs($admin)
            ->from("/admin/events/{$event->id}")
            ->post("/admin/events/{$event->id}/email", [
                'subject' => 'Hi', 'body' => '<p>Hello</p>',
                'recipient_ids' => [$lead->id], 'template_id' => $template->id,
            ])->assertRedirect();

        Mail::assertQueued(TemplatedMessage::class, fn ($m) =>
            $m->bannerImage === 'templates/banners/custom.png'
            && $m->footerImage === 'templates/footers/custom.png');
    }

    public function test_requires_subject_body_and_recipients(): void
    {
        $event = $this->event();
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->from("/admin/events/{$event->id}")
            ->post("/admin/events/{$event->id}/email", [])
            ->assertSessionHasErrors(['subject', 'body', 'recipient_ids']);
    }
}
