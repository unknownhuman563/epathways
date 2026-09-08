<?php

namespace Tests\Feature\Immigration;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Free assessments (a Lead, not an intake) can also be edited inline from the
 * modal — their Personal-detail fields map 1:1 to Lead columns. Only those
 * whitelisted columns are writable; other Lead columns can't be touched.
 */
class FreeAssessmentInlineEditTest extends TestCase
{
    use RefreshDatabase;

    public function test_free_personal_fields_are_editable_and_saveable(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'immigration']));

        $lead = Lead::create([
            'first_name' => 'Free', 'last_name' => 'Edit', 'email' => 'f@example.com',
            'dob' => '1987-06-26', 'citizenship' => 'India', 'status' => 'New Leads',
        ]);

        // The payload marks Personal-detail fields editable (not read-only).
        $data = $this->getJson("/portal/immigration/assessments/free/{$lead->id}/data")->json();
        $citizenship = collect($data['sections'])->flatMap(fn ($s) => $s['fields'])->firstWhere('key', 'citizenship');
        $this->assertNotNull($citizenship);
        $this->assertTrue($citizenship['editable']);

        // Edit + save via the shared intake-update endpoint (type "free").
        $this->patchJson("/portal/immigration/intakes/free/{$lead->id}", [
            'fields' => ['citizenship' => 'Nepal', 'other_names' => 'Johnny', 'status' => 'Hacked'],
        ])->assertOk();

        $lead->refresh();
        $this->assertSame('Nepal', $lead->citizenship);   // whitelisted → saved
        $this->assertSame('Johnny', $lead->other_names);   // whitelisted → saved
        $this->assertSame('New Leads', $lead->status);     // not whitelisted → untouched
    }
}
