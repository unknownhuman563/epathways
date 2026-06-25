<?php

namespace Tests\Feature\Search;

use App\Models\EoiSubmission;
use App\Models\Lead;
use App\Models\Property;
use App\Models\User;
use App\Services\SearchService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SearchUrlResolutionTest extends TestCase
{
    use RefreshDatabase;

    private SearchService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new SearchService();
    }

    private function user(string $role): User
    {
        return User::factory()->create(['role' => $role]);
    }

    public function test_lead_url_resolves_to_admin_route_for_admin(): void
    {
        $lead = Lead::create(['first_name' => 'A', 'last_name' => 'B']);
        $url = $this->service->resolveUrl(Lead::class, $lead, $this->user('admin'));
        $this->assertSame("/admin/leads/{$lead->id}", $url);
    }

    public function test_lead_url_resolves_to_sales_route_for_sales(): void
    {
        $lead = Lead::create(['first_name' => 'A', 'last_name' => 'B']);
        $url = $this->service->resolveUrl(Lead::class, $lead, $this->user('sales'));
        $this->assertSame("/portal/sales/leads/{$lead->id}", $url);
    }

    public function test_lead_url_respects_role_not_flags(): void
    {
        // Lead is an immigration case, but a sales user must still be sent to
        // the sales portal — URL is by viewer role, not the lead's flags.
        $lead = Lead::create(['first_name' => 'A', 'last_name' => 'B', 'is_immigration_case' => true]);

        $this->assertSame(
            "/portal/sales/leads/{$lead->id}",
            $this->service->resolveUrl(Lead::class, $lead, $this->user('sales'))
        );
        $this->assertSame(
            "/portal/immigration/leads/{$lead->id}",
            $this->service->resolveUrl(Lead::class, $lead, $this->user('immigration'))
        );
    }

    public function test_property_url_resolves_to_accommodation_route(): void
    {
        $p = Property::create(['name' => 'House', 'location' => 'AKL', 'room_type' => 'single', 'rent_single' => 200, 'status' => 'available']);
        $url = $this->service->resolveUrl(Property::class, $p, $this->user('accommodation'));
        $this->assertSame("/portal/accommodation/properties/{$p->id}", $url);
    }

    public function test_eoi_submission_url_goes_to_applications(): void
    {
        $eoi = EoiSubmission::create([
            'full_legal_name' => 'Jane Doe', 'id_number' => 'ID123', 'visa_status' => 'work',
            'nationality' => 'NZ', 'preferred_name' => 'Jane', 'email' => 'jane@example.com', 'mobile' => '+64210000000',
            'age' => 30, 'room_type_interest' => 'single', 'tenancy_start_date' => '2026-07-01', 'stay_duration' => '6 months',
            'occupants' => 1, 'occupant_ages' => '30', 'employment_status' => 'employed', 'current_address' => '1 St',
            'current_address_duration' => '2 years', 'living_situation' => 'renting', 'reason_for_moving' => 'work',
            'drinks_alcohol' => false, 'work_hours' => 'day', 'flatmate_description' => 'tidy', 'preferred_viewing_time' => 'evening',
            'status' => 'new',
        ]);
        $url = $this->service->resolveUrl(EoiSubmission::class, $eoi, $this->user('accommodation'));
        $this->assertSame("/portal/accommodation/applications/{$eoi->id}", $url);
    }

    public function test_program_and_school_urls_are_education_or_admin(): void
    {
        $prog = \App\Models\Program::create(['title' => 'Dip IT', 'level' => 5, 'category' => 'diplomas', 'status' => 'published']);
        $this->assertSame('/admin/programs', $this->service->resolveUrl(\App\Models\Program::class, $prog, $this->user('admin')));
        $this->assertSame('/portal/education/programs', $this->service->resolveUrl(\App\Models\Program::class, $prog, $this->user('education')));
    }

    public function test_see_all_url_present_when_results_exceed_group_cap(): void
    {
        for ($i = 0; $i < 7; $i++) {
            Lead::create(['first_name' => 'Bulk', 'last_name' => "Lead{$i}"]);
        }

        $groups = $this->service->search('Bulk', $this->user('admin'));
        $leads = collect($groups)->firstWhere('type', 'Lead');

        $this->assertSame(7, $leads['total']);
        $this->assertSame('/admin/leads?search=Bulk', $leads['see_all_url']);
    }

    public function test_no_see_all_url_when_results_within_cap(): void
    {
        Lead::create(['first_name' => 'Lonely', 'last_name' => 'Lead']);

        $groups = $this->service->search('Lonely', $this->user('admin'));
        $leads = collect($groups)->firstWhere('type', 'Lead');

        $this->assertNull($leads['see_all_url']);
    }
}
