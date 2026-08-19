<?php

namespace Tests\Feature;

use App\Models\Booking;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingDedupeTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'first_name' => 'Aman',
            'last_name' => 'Raj',
            'email' => 'amanraj2002aman@gmail.com',
            'phone' => '+64211111111',
            'service_type' => 'Immigration Consultation',
            'consultant_name' => 'Immigration Advisers',
            'appointment_date' => '2026-08-19',
            'appointment_time' => '4:00 PM',
            'appointment_at' => '2026-08-19 04:00:00',
            'current_country' => 'India',
            'platform' => 'In-System',
        ], $overrides);
    }

    public function test_identical_resubmit_does_not_create_a_duplicate_booking(): void
    {
        $this->postJson('/bookings', $this->payload())->assertStatus(201);

        // A double-click / widget re-fire posts the same booking again.
        $second = $this->postJson('/bookings', $this->payload());
        $second->assertOk()->assertJson(['duplicate' => true]);

        $this->assertSame(1, Booking::where('email', 'amanraj2002aman@gmail.com')->count());
    }

    public function test_same_client_can_still_book_a_different_slot(): void
    {
        $this->postJson('/bookings', $this->payload())->assertStatus(201);

        // Different time → a genuine second booking, not a duplicate.
        $this->postJson('/bookings', $this->payload([
            'appointment_time' => '1:00 PM',
            'appointment_at' => '2026-08-19 01:00:00',
        ]))->assertStatus(201);

        $this->assertSame(2, Booking::where('email', 'amanraj2002aman@gmail.com')->count());
    }

    public function test_unique_index_backstops_a_raced_duplicate(): void
    {
        $this->postJson('/bookings', $this->payload())->assertStatus(201);
        $b = Booking::first();

        // Simulate the concurrent race: a second identical INSERT must be
        // rejected by the DB unique index rather than duplicating the row.
        $this->expectException(\Illuminate\Database\QueryException::class);
        Booking::create([
            'lead_id' => $b->lead_id,
            'first_name' => 'Aman', 'email' => 'amanraj2002aman@gmail.com',
            'service_type' => 'Immigration Consultation',
            'consultant_name' => 'Immigration Advisers',
            'appointment_date' => '2026-08-19', 'appointment_time' => '4:00 PM',
            'appointment_at' => '2026-08-19 04:00:00',
        ]);
    }
}
