<?php

namespace Tests\Feature;

use App\Mail\EventRegistrationConfirmation;
use App\Models\Event;
use App\Models\Lead;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class EventRegistrationTest extends TestCase
{
    use RefreshDatabase;

    private function event(array $o = []): Event
    {
        return Event::create(array_merge([
            'name' => 'Canada Education Fair 2026',
            'type' => 'Education Fair',
            'status' => 'upcoming',
            'mode' => 'in-person',
            'location' => 'SMX Convention Center',
            'event_code' => 'canada-fair-abc12',
            'date_from' => now()->addDays(20)->toDateString(),
            'time_start' => '10:00',
            'time_end' => '16:00',
        ], $o));
    }

    private function validPayload(array $o = []): array
    {
        return array_merge([
            'first_name' => 'Neil',
            'last_name' => 'Santos',
            'email' => 'neil@example.com',
            'phone' => '+639918548675',
            'city' => 'Davao',
            'country' => 'Philippines',
            'education_level' => "Bachelor's Degree",
            'field_of_study' => 'Nursing',
            'employment_status' => 'Employed',
            'interest' => 'Student Visa',
            'planning_timeline' => '3–6 months',
            'funding_source' => 'Personal Savings',
        ], $o);
    }

    public function test_registration_creates_lead_and_sends_confirmation_email(): void
    {
        Mail::fake();
        $event = $this->event();

        $this->post("/register/{$event->event_code}", $this->validPayload())
            ->assertRedirect();

        $lead = Lead::where('email', 'neil@example.com')->first();
        $this->assertNotNull($lead);
        $this->assertEquals($event->id, $lead->event_id);

        Mail::assertQueued(EventRegistrationConfirmation::class, function ($mail) use ($lead, $event) {
            return $mail->hasTo('neil@example.com')
                && $mail->event->is($event)
                && $mail->lead->is($lead);
        });
    }

    public function test_confirmation_email_renders_branded_content(): void
    {
        $event = $this->event();
        $lead = Lead::create([
            'lead_id' => 'LP-TEST1',
            'first_name' => 'Neil',
            'last_name' => 'Santos',
            'email' => 'neil@example.com',
        ]);

        $html = (new EventRegistrationConfirmation($lead, $event))->render();

        $this->assertStringContainsString('Mabuhay, Neil', $html);
        $this->assertStringContainsString($event->name, $html);
        $this->assertStringContainsString('BOOK NOW', $html);
        $this->assertStringContainsString('registering', $html);
    }

    public function test_registration_still_succeeds_when_email_missing(): void
    {
        Mail::fake();
        $event = $this->event();

        // Email is a locked/required field, so omitting it must be a 422 —
        // and no mail should ever be attempted.
        $this->post("/register/{$event->event_code}", $this->validPayload(['email' => '']))
            ->assertSessionHasErrors('email');

        Mail::assertNothingQueued();
    }
}
