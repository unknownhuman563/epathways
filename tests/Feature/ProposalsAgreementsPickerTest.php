<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The "New proposal or agreement" lead picker must include leads that have
 * progressed out of the raw pipeline — a free-assessment enquiry (even once it
 * becomes a student or a case) and students — otherwise staff can't search
 * their name to generate a document. Previously the picker used
 * inLeadPipeline() which hid all of them.
 */
class ProposalsAgreementsPickerTest extends TestCase
{
    use RefreshDatabase;

    private function pickerLeadIds(): array
    {
        $this->actingAs(User::factory()->create(['role' => 'education']));
        $res = $this->get('/portal/education/leads/proposals-agreements')->assertOk();
        $ids = [];
        $res->assertInertia(function ($page) use (&$ids) {
            $ids = collect($page->toArray()['props']['picker'] ?? [])->pluck('lead_id')->all();
        });

        return $ids;
    }

    public function test_picker_includes_free_assessment_lead_even_when_converted(): void
    {
        Lead::create([
            'lead_id' => 'FA-FRESH', 'first_name' => 'Fresh', 'last_name' => 'Enquiry',
            'email' => 'fresh@example.com', 'source' => 'free-assessment',
        ]);
        // A free-assessment lead that has since been converted to a case.
        Lead::create([
            'lead_id' => 'FA-CASE', 'first_name' => 'Converted', 'last_name' => 'Case',
            'email' => 'case@example.com', 'source' => 'free-assessment', 'is_immigration_case' => true,
        ]);

        $ids = $this->pickerLeadIds();
        $this->assertContains('FA-FRESH', $ids);
        $this->assertContains('FA-CASE', $ids);
    }

    public function test_picker_includes_students(): void
    {
        Lead::create([
            'lead_id' => 'STU-1', 'first_name' => 'Study', 'last_name' => 'Only',
            'email' => 'stu@example.com', 'is_student' => true,
        ]);

        $this->assertContains('STU-1', $this->pickerLeadIds());
    }

    public function test_picker_excludes_pure_accommodation_clients(): void
    {
        Lead::create([
            'lead_id' => 'ACC-1', 'first_name' => 'Accom', 'last_name' => 'Only',
            'email' => 'acc@example.com', 'is_accommodation_client' => true, 'source' => 'onboarding',
        ]);

        $this->assertNotContains('ACC-1', $this->pickerLeadIds());
    }
}
