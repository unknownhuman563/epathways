<?php

namespace Tests\Feature\Bookings;

use App\Models\Booking;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class StaffBookForLeadTest extends TestCase
{
    use RefreshDatabase;

    private function slot(): array
    {
        return [
            'service_type' => 'education',
            'consultant_name' => 'Emma Ceballo',
            'appointment_date' => '2026-09-10',
            'appointment_time' => '9:00 AM',
            'appointment_at' => '2026-09-10T01:00:00Z',
            'client_timezone' => 'Asia/Manila',
        ];
    }

    public function test_staff_can_book_a_consultation_for_an_existing_lead(): void
    {
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $lead = Lead::create([
            'first_name' => 'Viswarm', 'last_name' => 'Gopaul', 'email' => 'v@example.com',
            'phone' => '+230 57044919', 'tracking_code' => 'BK001', 'status' => 'Consultation Done',
        ]);

        $this->actingAs($admin)->post("/admin/leads/{$lead->id}/booking", $this->slot())
            ->assertRedirect();

        $booking = Booking::where('lead_id', $lead->id)->first();
        $this->assertNotNull($booking);
        $this->assertSame('Emma Ceballo', $booking->consultant_name);
        $this->assertSame('education', $booking->service_type);
        $this->assertSame('9:00 AM', $booking->appointment_time);
        $this->assertSame('v@example.com', $booking->email);
        // The lead's own details were used (no intake form).
        $this->assertSame('Viswarm', $booking->first_name);
        // Booking advances the lead to "Booking Confirmation".
        $this->assertSame('Booking Confirmation', $lead->fresh()->status);
    }

    public function test_double_submit_does_not_create_a_duplicate(): void
    {
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $lead = Lead::create(['first_name' => 'A', 'last_name' => 'B', 'email' => 'a@b.com', 'tracking_code' => 'BK002']);

        $this->actingAs($admin)->post("/admin/leads/{$lead->id}/booking", $this->slot())->assertRedirect();
        $this->actingAs($admin)->post("/admin/leads/{$lead->id}/booking", $this->slot())->assertRedirect();

        $this->assertSame(1, Booking::where('lead_id', $lead->id)->count());
    }

    public function test_non_staff_cannot_book(): void
    {
        $lead = Lead::create(['first_name' => 'A', 'last_name' => 'B', 'email' => 'a@b.com', 'tracking_code' => 'BK003']);
        // A logged-out request is redirected to login (not allowed through).
        $this->post("/admin/leads/{$lead->id}/booking", $this->slot())->assertRedirect('/login');
    }
}
