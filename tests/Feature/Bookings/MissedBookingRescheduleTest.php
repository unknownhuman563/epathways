<?php

namespace Tests\Feature\Bookings;

use App\Models\Booking;
use App\Models\Lead;
use App\Models\MessageTemplate;
use App\Services\CommunicationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MissedBookingRescheduleTest extends TestCase
{
    use RefreshDatabase;

    public function test_buildContext_exposes_reschedule_and_cancel_urls_from_the_leads_booking(): void
    {
        $lead = Lead::create(['first_name' => 'A', 'last_name' => 'L', 'email' => 'a@x.com', 'tracking_code' => 'RSCHT1']);
        $booking = Booking::create([
            'lead_id' => $lead->id, 'first_name' => 'A', 'last_name' => 'L', 'email' => 'a@x.com',
            'service_type' => 'consultation', 'consultant_name' => 'Emma', 'appointment_at' => now()->subDay(), 'status' => 'missed',
        ]);

        $ctx = (fn ($l) => $this->buildContext($l, []))
            ->call(app(CommunicationService::class), $lead->fresh());

        $this->assertStringContainsString('/booking/reschedule/'.$booking->manage_token, $ctx['reschedule_url']);
        $this->assertStringContainsString('/booking/cancel/'.$booking->manage_token, $ctx['cancel_url']);
    }

    public function test_reschedule_url_falls_back_to_tracker_when_no_booking(): void
    {
        $lead = Lead::create(['first_name' => 'A', 'last_name' => 'L', 'email' => 'a@x.com', 'tracking_code' => 'RSCHT2']);

        $ctx = (fn ($l) => $this->buildContext($l, []))
            ->call(app(CommunicationService::class), $lead);

        $this->assertStringContainsString('/track/RSCHT2', $ctx['reschedule_url']);
    }

    public function test_missed_booking_template_button_renders_a_real_reschedule_link(): void
    {
        $lead = Lead::create(['first_name' => 'A', 'last_name' => 'L', 'email' => 'a@x.com', 'tracking_code' => 'RSCHT3']);
        $booking = Booking::create([
            'lead_id' => $lead->id, 'first_name' => 'A', 'last_name' => 'L', 'email' => 'a@x.com',
            'service_type' => 'consultation', 'consultant_name' => 'Emma', 'appointment_at' => now()->subDay(), 'status' => 'missed',
        ]);

        // A template body like the fixed one (href = {{reschedule_url}}).
        $tpl = MessageTemplate::create([
            'key' => 'missed_the_booking_1', 'name' => 'Missed booking', 'department' => '',
            'email_subject' => 'You missed your consultation',
            'email_body' => '<a href="{{reschedule_url}}"><strong>Reschedule my consultation</strong></a>',
            'channels' => ['email'],
        ]);

        $rendered = (fn ($t, $l, $x) => $this->substitute($t->email_body, $this->buildContext($l, $x), false))
            ->call(app(CommunicationService::class), $tpl, $lead->fresh(), []);

        $this->assertStringContainsString('/booking/reschedule/'.$booking->manage_token, $rendered);
        $this->assertStringNotContainsString('{{reschedule_url}}', $rendered);
    }
}
