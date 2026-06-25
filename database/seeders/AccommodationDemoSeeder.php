<?php

namespace Database\Seeders;

use App\Models\Property;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Sample managed properties + tenants so the Accommodation portal has
 * something to click through. Idempotent: re-running replaces the demo rows
 * (matched by property code) rather than duplicating them.
 *
 *   php artisan db:seed --class=AccommodationDemoSeeder
 */
class AccommodationDemoSeeder extends Seeder
{
    public function run(): void
    {
        $codes = ['1', '2', '13', '7'];

        // Clear any previous demo rows (tenants first — FK is restrict).
        foreach (Property::whereIn('code', $codes)->get() as $existing) {
            $existing->tenants()->withTrashed()->forceDelete();
            $existing->delete();
        }

        $p1 = Property::create([
            'code' => '1', 'name' => 'Vazey Way Room', 'address' => '21 Vazey Way, Hobsonville',
            'city' => 'Auckland', 'region' => 'North Shore', 'property_type' => 'House',
            'suburb' => 'Hobsonville', 'location' => 'Auckland, NZ', 'total_rooms' => 5,
            'room_type' => 'single', 'rent_single' => 250, 'rent_couple' => 320, 'status' => 'available',
            'is_active' => true, 'mercury_account_number' => '120234173', 'mercury_account_holder' => 'Dinah',
            'property_icp' => '1002154990QT858', 'house_code' => '20124*', 'internet_passcode' => '29@vazeywf',
            'bond_total_nzd' => 2000, 'advance_total_nzd' => 1000, 'property_manager_name' => 'Dinah Roberts',
            'property_manager_phone' => '021 555 0101', 'property_manager_email' => 'dinah@example.com',
            'pm_payment_schedule' => 'Every Friday', 'uses_bottled_gas' => true,
            'last_gas_purchase' => Carbon::today()->subDays(20),
        ]);

        $p2 = Property::create([
            'code' => '2', 'name' => 'Glenfield Townhouse', 'address' => '5 Glenfield Rd, Glenfield',
            'city' => 'Auckland', 'property_type' => 'Townhouse', 'suburb' => 'Glenfield',
            'location' => 'Auckland, NZ', 'total_rooms' => 3, 'room_type' => 'ensuite',
            'rent_single' => 280, 'status' => 'available', 'is_active' => true,
            'property_manager_name' => 'Greg Tan', 'pm_payment_schedule' => 'Fortnight Friday',
        ]);

        $p3 = Property::create([
            'code' => '13', 'name' => 'Kelston Apartment', 'address' => '88 Kelston Dr, Kelston',
            'city' => 'Auckland', 'property_type' => 'Apartment', 'suburb' => 'Kelston',
            'location' => 'Auckland, NZ', 'total_rooms' => 4, 'room_type' => 'single',
            'rent_single' => 230, 'status' => 'available', 'is_active' => true,
            'property_manager_name' => 'Priya Nair', 'pm_payment_schedule' => 'Auto Monday',
        ]);

        // A vacant property — no tenants.
        Property::create([
            'code' => '7', 'name' => 'Sunnynook House', 'address' => '12 Sunnynook Pl, Sunnynook',
            'city' => 'Auckland', 'property_type' => 'House', 'suburb' => 'Sunnynook',
            'location' => 'Auckland, NZ', 'total_rooms' => 6, 'room_type' => 'single',
            'rent_single' => 240, 'status' => 'available', 'is_active' => true,
        ]);

        // --- Tenants -------------------------------------------------------

        // P1 — ending soon, fully documented, shared tenancy.
        Tenant::create([
            'property_id' => $p1->id, 'unit' => '29A', 'first_name' => 'Angela', 'family_name' => 'Reyes',
            'display_name_override' => 'Angela & Novie', 'email' => 'angela@example.com', 'phone' => '021 234 5678',
            'whatsapp' => '021 234 5678', 'nationality' => 'Filipino', 'contract_type' => 'fixed_term',
            'contract_start' => Carbon::today()->subMonths(11), 'contract_end' => Carbon::today()->addDays(12),
            'weekly_rent_nzd' => 250, 'weekly_utilities_nzd' => 40, 'bond_paid_nzd' => 1000, 'advance_paid_nzd' => 500,
            'has_passport_in_drive' => true, 'has_tenancy_agreement_in_drive' => true, 'has_inspection_report_in_drive' => true,
            'current_status' => 'active', 'passport_number' => 'P1234567',
        ]);

        // P1 — comfortable, missing the inspection report.
        Tenant::create([
            'property_id' => $p1->id, 'first_name' => 'Sam', 'family_name' => 'Park', 'email' => 'sam.park@example.com',
            'phone' => '022 888 1111', 'nationality' => 'Korean', 'contract_type' => 'fixed_term',
            'contract_start' => Carbon::today()->subMonths(2), 'contract_end' => Carbon::today()->addDays(60),
            'weekly_rent_nzd' => 250, 'weekly_utilities_nzd' => 40, 'bond_paid_nzd' => 1000,
            'has_passport_in_drive' => true, 'has_tenancy_agreement_in_drive' => true, 'has_inspection_report_in_drive' => false,
            'current_status' => 'active',
        ]);

        // P1 — historical (vacated).
        Tenant::create([
            'property_id' => $p1->id, 'first_name' => 'John', 'family_name' => 'Doe', 'email' => 'john@example.com',
            'contract_type' => 'fixed_term', 'contract_start' => Carbon::today()->subYear(),
            'contract_end' => Carbon::today()->subMonths(2), 'current_status' => 'vacated',
            'ended_at' => Carbon::today()->subMonths(2),
        ]);

        // P2 — overdue (contract already ended, not vacated) + missing docs.
        Tenant::create([
            'property_id' => $p2->id, 'first_name' => 'Maria', 'family_name' => 'Cruz', 'email' => 'maria@example.com',
            'phone' => '027 333 2222', 'nationality' => 'Filipino', 'contract_type' => 'fixed_term',
            'contract_start' => Carbon::today()->subMonths(13), 'contract_end' => Carbon::today()->subDays(5),
            'weekly_rent_nzd' => 280, 'weekly_utilities_nzd' => 50, 'bond_paid_nzd' => 1120,
            'has_passport_in_drive' => false, 'has_tenancy_agreement_in_drive' => true, 'has_inspection_report_in_drive' => false,
            'current_status' => 'active',
        ]);

        // P2 — no contract dates on file.
        Tenant::create([
            'property_id' => $p2->id, 'first_name' => 'Liam', 'family_name' => 'Smith', 'email' => 'liam@example.com',
            'contract_type' => 'not_yet_defined', 'weekly_rent_nzd' => 280, 'current_status' => 'active',
            'has_tenancy_agreement_in_drive' => true,
        ]);

        // P3 — notice given.
        Tenant::create([
            'property_id' => $p3->id, 'first_name' => 'Chen', 'family_name' => 'Wei', 'email' => 'chen@example.com',
            'phone' => '021 777 9999', 'nationality' => 'Chinese', 'contract_type' => 'periodic',
            'open_contract_notice_weeks' => 4, 'contract_start' => Carbon::today()->subMonths(8),
            'contract_end' => Carbon::today()->addDays(20), 'weekly_rent_nzd' => 230, 'weekly_utilities_nzd' => 35,
            'bond_paid_nzd' => 920, 'has_passport_in_drive' => true, 'has_tenancy_agreement_in_drive' => true,
            'has_inspection_report_in_drive' => true, 'current_status' => 'notice_given',
            'notes' => 'Tenant gave notice — relocating for work.',
        ]);

        $this->seedOnboarding($p1, $p3);
        $this->seedCalendar($p1, $p3);

        $this->command?->info('Seeded 4 properties, 6 tenants, 8 onboarding applications and 3 calendar events.');
    }

    /** A few staff-added custom calendar events. */
    private function seedCalendar(Property $p1, Property $p3): void
    {
        $staff = \App\Models\User::whereIn('role', ['accommodation', 'admin'])->first();
        if (! $staff) {
            return;
        }

        \App\Models\CalendarEvent::where('created_by_user_id', $staff->id)
            ->whereIn('title', ['Property inspection', 'Quarterly portfolio review', 'Locksmith — change door codes'])
            ->forceDelete();

        \App\Models\CalendarEvent::create([
            'title' => 'Property inspection', 'description' => 'Routine quarterly inspection.',
            'starts_at' => now()->addDay()->setTime(10, 0), 'ends_at' => now()->addDay()->setTime(11, 0),
            'property_id' => $p1->id, 'location' => $p1->address, 'color_hex' => '#1F5A8B',
            'created_by_user_id' => $staff->id,
        ]);
        \App\Models\CalendarEvent::create([
            'title' => 'Quarterly portfolio review', 'starts_at' => now()->addDays(5)->startOfDay(),
            'is_all_day' => true, 'color_hex' => '#0EA5E9', 'created_by_user_id' => $staff->id,
        ]);
        \App\Models\CalendarEvent::create([
            'title' => 'Locksmith — change door codes', 'starts_at' => now()->addDays(12)->setTime(14, 0),
            'ends_at' => now()->addDays(12)->setTime(15, 30), 'property_id' => $p3->id,
            'color_hex' => '#6B7280', 'created_by_user_id' => $staff->id,
        ]);
    }

    /** EOI submissions spread across the onboarding pipeline. */
    private function seedOnboarding(Property $p1, Property $p3): void
    {
        \App\Models\EoiSubmission::where('email', 'like', '%@onboarding.demo')->forceDelete();

        $staff = \App\Models\User::whereIn('role', ['accommodation', 'admin'])->first();

        $base = fn (array $o) => array_merge([
            'full_legal_name' => 'Applicant', 'id_number' => 'ID1', 'visa_status' => 'Work Visa',
            'nationality' => 'Filipino', 'preferred_name' => 'App', 'email' => 'a@onboarding.demo',
            'mobile' => '0210000000', 'age' => 30,
            'room_type_interest' => 'One Single Room (shared toilet and bathroom)',
            'tenancy_start_date' => now()->addWeeks(3)->toDateString(), 'stay_duration' => '12 months',
            'occupants' => 'Just me', 'occupant_ages' => '30', 'employment_status' => 'Full-time employment',
            'current_address' => '1 Demo St', 'current_address_duration' => '1 year',
            'living_situation' => 'Renting', 'reason_for_moving' => 'New job',
            'drinks_alcohol' => 'Socially', 'work_hours' => 'Day', 'flatmate_description' => 'Easy-going',
            'preferred_viewing_time' => 'Flexible', 'confirm_accurate' => true, 'consent_collection' => true,
        ], $o);

        $rows = [
            ['full_legal_name' => 'Grace Mendoza', 'email' => 'grace@onboarding.demo', 'form_type' => 'hot', 'status' => 'new', 'property_interested' => '21 Vazey Way', 'property_id' => $p1->id],
            ['full_legal_name' => 'Tom Harris', 'email' => 'tom@onboarding.demo', 'form_type' => 'cold', 'status' => 'reviewed'],
            ['full_legal_name' => 'Ling Chen', 'email' => 'ling@onboarding.demo', 'form_type' => 'hot', 'status' => 'shortlisted', 'property_id' => $p3->id, 'assigned_to_user_id' => $staff?->id],
            ['full_legal_name' => 'Amara Okafor', 'email' => 'amara@onboarding.demo', 'form_type' => 'hot', 'status' => 'viewing_email_sent', 'property_id' => $p3->id, 'viewing_email_sent_at' => now()->subHours(6), 'assigned_to_user_id' => $staff?->id],
            ['full_legal_name' => 'Ravi Patel', 'email' => 'ravi@onboarding.demo', 'form_type' => 'hot', 'status' => 'viewing_booked', 'property_id' => $p1->id, 'viewing_scheduled_at' => now()->addDays(2), 'assigned_to_user_id' => $staff?->id],
            ['full_legal_name' => 'Sara Lee', 'email' => 'sara@onboarding.demo', 'form_type' => 'cold', 'status' => 'viewing_completed', 'viewing_completed_at' => now()->subDay(), 'viewing_outcome' => 'Liked the place.'],
            ['full_legal_name' => 'Diego Santos', 'email' => 'diego@onboarding.demo', 'form_type' => 'hot', 'status' => 'post_viewing_followup', 'property_id' => $p1->id, 'viewing_completed_at' => now()->subDays(2), 'post_viewing_followup_at' => now()->subDay(), 'assigned_to_user_id' => $staff?->id],
            ['full_legal_name' => 'Mike Brown', 'email' => 'mike@onboarding.demo', 'form_type' => 'hot', 'status' => 'agreement_sent', 'property_id' => $p3->id, 'tenancy_agreement_sent_at' => now()->subDays(2)],
            ['full_legal_name' => 'Nina Park', 'email' => 'nina@onboarding.demo', 'form_type' => 'hot', 'status' => 'payment_confirmed', 'property_id' => $p1->id, 'invoice_amount_nzd' => 1500, 'invoice_sent_at' => now()->subDays(4), 'payment_confirmed_at' => now()->subDay(), 'assigned_to_user_id' => $staff?->id],
            ['full_legal_name' => 'Oscar Diaz', 'email' => 'oscar@onboarding.demo', 'form_type' => 'cold', 'status' => 'declined', 'declined_reason' => 'Did not meet income criteria.'],
        ];

        foreach ($rows as $row) {
            \App\Models\EoiSubmission::create($base($row));
        }
    }
}
