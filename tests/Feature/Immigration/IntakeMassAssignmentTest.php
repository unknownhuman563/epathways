<?php

namespace Tests\Feature\Immigration;

use App\Models\Booking;
use App\Models\StudentIntake;
use App\Models\VisitorIntake;
use App\Models\WorkIntake;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IntakeMassAssignmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_work_intake_mass_assigns_typical_fields(): void
    {
        $intake = WorkIntake::create([
            'intake_id'            => 'WI-1',
            'status'               => 'New',
            'edit_token'           => 'tok-work',
            'first_name'           => 'Jane',
            'family_name'          => 'Doe',
            'email'                => 'jane@example.com',
            'phone'                => '+64 21 000 0000',
            'dob'                  => '1990-01-01',
            'job_start_date'       => '2026-07-01',
            'hourly_rate'          => 32.50,
            'family_members'       => [['name' => 'Kid', 'relation' => 'child']],
            'declaration_accepted' => true,
        ]);

        $intake->refresh();
        $this->assertSame('Jane', $intake->first_name);
        $this->assertSame('tok-work', $intake->edit_token);
        $this->assertEquals([['name' => 'Kid', 'relation' => 'child']], $intake->family_members);
        $this->assertTrue($intake->declaration_accepted);
    }

    public function test_student_intake_mass_assigns_typical_fields(): void
    {
        $intake = StudentIntake::create([
            'intake_id'            => 'SI-1',
            'status'               => 'New',
            'edit_token'           => 'tok-student',
            'first_name'           => 'Sam',
            'family_name'          => 'Lee',
            'dob'                  => '1998-05-05',
            'email'                => 'sam@example.com',
            'phone'                => '+64 21 222 2222',
            'passport_number'      => 'P1234567',
            'tuition_fee_nzd'      => 25000,
            'qualifications'       => [['name' => 'Diploma']],
            'available_funds'      => [['source' => 'savings', 'amount' => 30000]],
            'declaration_accepted' => true,
        ]);

        $intake->refresh();
        $this->assertSame('Sam', $intake->first_name);
        $this->assertSame('tok-student', $intake->edit_token);
        $this->assertEquals([['name' => 'Diploma']], $intake->qualifications);
        $this->assertTrue($intake->declaration_accepted);
    }

    public function test_visitor_intake_mass_assigns_typical_fields(): void
    {
        $intake = VisitorIntake::create([
            'intake_id'            => 'VI-1',
            'status'               => 'New',
            'edit_token'           => 'tok-visitor',
            'first_name'           => 'Ravi',
            'family_name'          => 'Patel',
            'dob'                  => '1985-03-03',
            'email'                => 'ravi@example.com',
            'phone'                => '+64 21 333 3333',
            'purpose_of_visit'     => 'Tourism',
            'intended_from'        => '2026-08-01',
            'intended_to'          => '2026-09-01',
            'travel_trips'         => [['country' => 'Australia', 'year' => 2024]],
            'declaration_accepted' => true,
        ]);

        $intake->refresh();
        $this->assertSame('Ravi', $intake->first_name);
        $this->assertSame('tok-visitor', $intake->edit_token);
        $this->assertEquals([['country' => 'Australia', 'year' => 2024]], $intake->travel_trips);
        $this->assertTrue($intake->declaration_accepted);
    }

    public function test_booking_mass_assigns_lead_id(): void
    {
        $lead = \App\Models\Lead::create([
            'first_name' => 'Pat',
            'last_name'  => 'Kim',
        ]);

        $booking = Booking::create([
            'first_name'      => 'Pat',
            'last_name'       => 'Kim',
            'email'           => 'pat@example.com',
            'phone'           => '+64 21 111 1111',
            'service_type'    => 'Consultation',
            'consultant_name' => 'Adviser One',
            'lead_id'         => $lead->id,
        ]);

        $this->assertSame($lead->id, $booking->fresh()->lead_id);
    }
}
