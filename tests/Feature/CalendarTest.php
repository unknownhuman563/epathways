<?php

namespace Tests\Feature;

use App\Models\CalendarEvent;
use App\Models\EoiSubmission;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\User;
use App\Services\CalendarEventAggregator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as AssertInertia;
use Tests\TestCase;

class CalendarTest extends TestCase
{
    use RefreshDatabase;

    private function user(): User
    {
        return User::factory()->create(['role' => 'accommodation']);
    }

    private static int $propCounter = 0;

    private function property(array $o = []): Property
    {
        $n = ++self::$propCounter;

        return Property::create(array_merge([
            'name' => "Cal House {$n}", 'rent_single' => 200, 'status' => 'available',
            'is_active' => true, 'total_rooms' => 4, 'code' => (string) $n, 'address' => "{$n} Cal St",
        ], $o));
    }

    private function tenant(array $o = []): Tenant
    {
        return Tenant::create(array_merge([
            'property_id' => $this->property()->id, 'first_name' => 'Ann', 'family_name' => 'Lee',
            'contract_type' => 'fixed_term', 'current_status' => 'active',
        ], $o));
    }

    private function viewing(array $o = []): EoiSubmission
    {
        return EoiSubmission::create(array_merge([
            'full_legal_name' => 'Jane Doe', 'id_number' => 'X', 'visa_status' => 'Work Visa',
            'nationality' => 'Filipino', 'preferred_name' => 'Jane', 'email' => 'jane@example.com',
            'mobile' => '021', 'age' => 30, 'room_type_interest' => 'One Single Room (shared toilet and bathroom)',
            'tenancy_start_date' => '2026-07-01', 'stay_duration' => '12 months', 'occupants' => 'Just me',
            'occupant_ages' => '30', 'employment_status' => 'Full-time employment', 'current_address' => '1 St',
            'current_address_duration' => '1 year', 'living_situation' => 'Renting', 'reason_for_moving' => 'Work',
            'drinks_alcohol' => 'Socially', 'work_hours' => 'Day', 'flatmate_description' => 'Tidy',
            'preferred_viewing_time' => 'Flexible', 'form_type' => 'hot', 'status' => 'viewing_booked',
        ], $o));
    }

    private function customEvent(User $creator, array $o = []): CalendarEvent
    {
        return CalendarEvent::create(array_merge([
            'title' => 'Inspection prep', 'starts_at' => now()->addDays(3), 'ends_at' => now()->addDays(3)->addHour(),
            'created_by_user_id' => $creator->id,
        ], $o));
    }

    private function eventsUrl(array $params): string
    {
        return '/portal/accommodation/calendar/events?'.http_build_query($params);
    }

    private function defaultRange(): array
    {
        return ['start' => now()->subDays(30)->toDateString(), 'end' => now()->addDays(60)->toDateString()];
    }

    // 1
    public function test_calendar_page_renders(): void
    {
        $this->actingAs($this->user())->get('/portal/accommodation/calendar')
            ->assertInertia(fn (AssertInertia $p) => $p->component('portal/accommodation/Calendar')->has('eventTypes'));
    }

    public function test_calendar_index_returns_kpis(): void
    {
        // Viewings: two booked (counted), one at another stage (ignored).
        $this->viewing();
        $this->viewing(['email' => 'b@example.com']);
        $this->viewing(['email' => 'c@example.com', 'status' => 'shortlisted']);

        // Ending soon: within 25 days (counted), too far (ignored), vacated (ignored).
        $this->tenant(['contract_end' => now()->addDays(10)]);
        $this->tenant(['contract_end' => now()->addDays(100)]);
        $this->tenant(['contract_end' => now()->addDays(10), 'current_status' => 'vacated']);

        $this->actingAs($this->user())->get('/portal/accommodation/calendar')
            ->assertInertia(fn (AssertInertia $p) => $p
                ->where('kpis.upcoming_viewings', 2)
                ->where('kpis.ending_soon', 1));
    }

    // 2
    public function test_events_endpoint_returns_events(): void
    {
        $this->viewing(['viewing_scheduled_at' => now()->addDays(2)]);
        $res = $this->actingAs($this->user())->getJson($this->eventsUrl($this->defaultRange()));
        $res->assertOk();
        $this->assertIsArray($res->json());
        $this->assertNotEmpty($res->json());
    }

    // 3
    public function test_range_over_90_days_is_rejected(): void
    {
        $this->actingAs($this->user())
            ->getJson($this->eventsUrl(['start' => now()->toDateString(), 'end' => now()->addDays(120)->toDateString()]))
            ->assertStatus(422);
    }

    // 4
    public function test_viewings_appear(): void
    {
        $this->viewing(['viewing_scheduled_at' => now()->addDays(2)]);
        $events = $this->actingAs($this->user())->getJson($this->eventsUrl($this->defaultRange()))->json();
        $this->assertContains('viewing', array_column($events, 'source_type'));
    }

    public function test_viewing_hidden_once_past_booked_stage(): void
    {
        $booked = $this->viewing(['viewing_scheduled_at' => now()->addDays(2)]); // status viewing_booked
        $movedIn = $this->viewing([
            'email' => 'gone@example.com', 'viewing_scheduled_at' => now()->addDays(3), 'status' => 'moved_in',
        ]);

        $events = collect($this->actingAs($this->user())->getJson($this->eventsUrl($this->defaultRange()))->json());
        $viewingIds = $events->where('source_type', 'viewing')->pluck('source_id');

        $this->assertTrue($viewingIds->contains($booked->id));      // pending viewing shows
        $this->assertFalse($viewingIds->contains($movedIn->id));    // tenant's old viewing is gone
    }

    // 5
    public function test_contract_ends_appear(): void
    {
        $this->tenant(['contract_end' => now()->addDays(10)]);
        $events = $this->actingAs($this->user())->getJson($this->eventsUrl($this->defaultRange()))->json();
        $this->assertContains('contract_end', array_column($events, 'source_type'));
    }

    // 6
    public function test_custom_events_appear(): void
    {
        $this->customEvent($this->user());
        $events = $this->actingAs($this->user())->getJson($this->eventsUrl($this->defaultRange()))->json();
        $this->assertContains('custom', array_column($events, 'source_type'));
    }

    // 7
    public function test_filter_by_event_types(): void
    {
        $this->viewing(['viewing_scheduled_at' => now()->addDays(2)]);
        $this->customEvent($this->user());
        $events = $this->actingAs($this->user())
            ->getJson($this->eventsUrl(array_merge($this->defaultRange(), ['event_types' => ['custom']])))->json();
        $types = array_unique(array_column($events, 'source_type'));
        $this->assertEquals(['custom'], array_values($types));
    }

    // 8
    public function test_filter_by_property_ids(): void
    {
        $a = $this->property();
        $b = $this->property();
        $this->customEvent($this->user(), ['property_id' => $a->id, 'title' => 'A event']);
        $this->customEvent($this->user(), ['property_id' => $b->id, 'title' => 'B event']);
        $events = $this->actingAs($this->user())
            ->getJson($this->eventsUrl(array_merge($this->defaultRange(), ['event_types' => ['custom'], 'property_ids' => [$a->id]])))->json();
        $titles = array_column($events, 'title');
        $this->assertContains('A event', $titles);
        $this->assertNotContains('B event', $titles);
    }

    // 9
    public function test_contract_end_color_coding(): void
    {
        $past = $this->tenant(['contract_end' => now()->subDays(3), 'first_name' => 'Past']);
        $soon = $this->tenant(['contract_end' => now()->addDays(10), 'first_name' => 'Soon']);
        $far = $this->tenant(['contract_end' => now()->addDays(50), 'first_name' => 'Far']);

        $events = collect($this->actingAs($this->user())->getJson($this->eventsUrl($this->defaultRange()))->json())
            ->keyBy('source_id');

        $this->assertEquals('#DC2626', $events["{$past->id}"]['color'] ?? $events[$past->id]['color']);
        $this->assertEquals('#F59E0B', $events[$soon->id]['color']);
        $this->assertEquals('#6B7280', $events[$far->id]['color']);
    }

    // 10
    public function test_custom_event_creation_persists(): void
    {
        $this->actingAs($this->user())
            ->postJson('/portal/accommodation/calendar/events', [
                'title' => 'Team meeting', 'starts_at' => now()->addDays(1)->toDateTimeString(),
            ])->assertCreated();
        $this->assertDatabaseHas('accommodation_calendar_events', ['title' => 'Team meeting']);
    }

    // 11
    public function test_custom_event_title_max_length(): void
    {
        $this->actingAs($this->user())
            ->postJson('/portal/accommodation/calendar/events', [
                'title' => str_repeat('x', 201), 'starts_at' => now()->addDay()->toDateTimeString(),
            ])->assertStatus(422);
    }

    // 12
    public function test_update_only_allowed_for_creator(): void
    {
        $owner = $this->user();
        $event = $this->customEvent($owner);

        $this->actingAs($this->user()) // different user
            ->patchJson("/portal/accommodation/calendar/events/{$event->id}", ['title' => 'Hacked'])
            ->assertForbidden();

        $this->actingAs($owner)
            ->patchJson("/portal/accommodation/calendar/events/{$event->id}", ['title' => 'Renamed'])
            ->assertOk();
        $this->assertEquals('Renamed', $event->fresh()->title);
    }

    // 13
    public function test_delete_soft_deletes(): void
    {
        $owner = $this->user();
        $event = $this->customEvent($owner);
        $this->actingAs($owner)->deleteJson("/portal/accommodation/calendar/events/{$event->id}")->assertOk();
        $this->assertSoftDeleted($event);
    }

    // 14
    public function test_soft_deleted_events_hidden(): void
    {
        $owner = $this->user();
        $event = $this->customEvent($owner, ['title' => 'Gone soon']);
        $event->delete();
        $events = $this->actingAs($owner)->getJson($this->eventsUrl($this->defaultRange()))->json();
        $this->assertNotContains('Gone soon', array_column($events, 'title'));
    }

    // 15
    public function test_viewing_without_property_uses_interested_string(): void
    {
        $this->viewing(['viewing_scheduled_at' => now()->addDays(2), 'property_id' => null, 'property_interested' => 'Some Glenfield Room']);
        $events = collect($this->actingAs($this->user())->getJson($this->eventsUrl($this->defaultRange()))->json());
        $viewing = $events->firstWhere('source_type', 'viewing');
        $this->assertEquals('Some Glenfield Room', $viewing['subtitle']);
    }

    // 16
    public function test_past_contract_ends_appear(): void
    {
        $this->tenant(['contract_end' => now()->subDays(10), 'current_status' => 'active', 'first_name' => 'Histor']);
        $events = $this->actingAs($this->user())->getJson($this->eventsUrl($this->defaultRange()))->json();
        $this->assertContains('contract_end', array_column($events, 'source_type'));
    }

    // 17
    public function test_performance_90_days_50_events(): void
    {
        $owner = $this->user();
        for ($i = 0; $i < 50; $i++) {
            $this->customEvent($owner, ['title' => "Event {$i}", 'starts_at' => now()->addDays($i % 80)]);
        }
        $agg = new CalendarEventAggregator;
        $start = microtime(true);
        $events = $agg->getEvents(Carbon::now()->subDays(10), Carbon::now()->addDays(80));
        $elapsed = microtime(true) - $start;
        $this->assertGreaterThanOrEqual(50, count($events));
        $this->assertLessThan(0.5, $elapsed, "Aggregation took {$elapsed}s");
    }
}
