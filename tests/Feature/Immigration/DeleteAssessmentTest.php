<?php

namespace Tests\Feature\Immigration;

use App\Models\Lead;
use App\Models\User;
use App\Models\VisitorIntake;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The Visa Assessment list mixes two kinds of rows: real intake submissions
 * (intake tables) and Lead-backed rows (in-progress visa drafts + free
 * assessments). Deleting used to assume an intake row, so deleting a draft
 * 404'd (VisitorIntake::findOrFail on a Lead id). The `record` marker routes
 * the delete to the right table.
 */
class DeleteAssessmentTest extends TestCase
{
    use RefreshDatabase;

    private function staff(): User
    {
        return User::factory()->create(['role' => 'immigration']);
    }

    public function test_deleting_a_visa_draft_removes_the_lead_not_404(): void
    {
        $lead = Lead::create([
            'first_name' => 'Visitor', 'last_name' => 'Test', 'email' => 'v@example.com',
            'source' => 'visitor-interest', 'status' => 'Draft',
        ]);

        $this->actingAs($this->staff())
            ->delete('/portal/immigration/assessments', [
                'record' => 'lead', 'intake_type' => 'visitor', 'intake_id' => $lead->id,
            ])
            ->assertSessionHasNoErrors();

        $this->assertSoftDeleted('leads', ['id' => $lead->id]);
    }

    public function test_deleting_a_free_assessment_removes_the_lead(): void
    {
        $lead = Lead::create([
            'first_name' => 'Free', 'last_name' => 'Enquiry', 'email' => 'f@example.com',
            'source' => 'free-assessment', 'status' => 'Submitted',
        ]);

        $this->actingAs($this->staff())
            ->delete('/portal/immigration/assessments', [
                'record' => 'lead', 'intake_type' => 'free', 'intake_id' => $lead->id,
            ])
            ->assertSessionHasNoErrors();

        $this->assertSoftDeleted('leads', ['id' => $lead->id]);
    }

    public function test_a_lead_that_is_already_a_case_is_not_deleted(): void
    {
        $lead = Lead::create([
            'first_name' => 'Cased', 'last_name' => 'Lead', 'email' => 'c@example.com',
            'source' => 'free-assessment', 'status' => 'Engaged', 'is_immigration_case' => true,
        ]);

        $this->actingAs($this->staff())
            ->delete('/portal/immigration/assessments', [
                'record' => 'lead', 'intake_type' => 'free', 'intake_id' => $lead->id,
            ]);

        $this->assertDatabaseHas('leads', ['id' => $lead->id, 'deleted_at' => null]);
    }

    public function test_record_marker_prevents_deleting_a_colliding_intake_row(): void
    {
        // A Lead and a VisitorIntake can share the same numeric id (separate
        // tables). record=lead must delete the Lead and leave the intake alone.
        $lead = Lead::create([
            'first_name' => 'Draft', 'last_name' => 'Lead', 'email' => 'd@example.com',
            'source' => 'visitor-interest', 'status' => 'Draft',
        ]);
        $intake = VisitorIntake::create([
            'intake_id' => 'VI-COLLIDE', 'status' => 'Submitted',
            'first_name' => 'Real', 'family_name' => 'Submit', 'email' => 'r@example.com',
            'dob' => '1990-01-01', 'phone' => '+64 21 000 0000',
        ]);

        $this->actingAs($this->staff())
            ->delete('/portal/immigration/assessments', [
                'record' => 'lead', 'intake_type' => 'visitor', 'intake_id' => $lead->id,
            ])
            ->assertSessionHasNoErrors();

        $this->assertSoftDeleted('leads', ['id' => $lead->id]);
        $this->assertDatabaseHas('visitor_intakes', ['id' => $intake->id]); // untouched
    }

    public function test_deleting_one_entry_leaves_every_other_entry_intact(): void
    {
        // A mixed list: the draft being deleted, plus another draft, a free
        // assessment, and a real intake that must all survive.
        $target = Lead::create([
            'first_name' => 'Visitor', 'last_name' => 'Test', 'email' => 'target@example.com',
            'source' => 'visitor-interest', 'status' => 'Draft',
        ]);
        $otherDraft = Lead::create([
            'first_name' => 'Other', 'last_name' => 'Draft', 'email' => 'other@example.com',
            'source' => 'work-interest', 'status' => 'Draft',
        ]);
        $free = Lead::create([
            'first_name' => 'Free', 'last_name' => 'Lead', 'email' => 'free@example.com',
            'source' => 'free-assessment', 'status' => 'Submitted',
        ]);
        $intake = VisitorIntake::create([
            'intake_id' => 'VI-KEEP', 'status' => 'Submitted',
            'first_name' => 'Keep', 'family_name' => 'Me', 'email' => 'keep@example.com',
            'dob' => '1990-01-01', 'phone' => '+64 21 111 2222',
        ]);

        $this->actingAs($this->staff())
            ->delete('/portal/immigration/assessments', [
                'record' => 'lead', 'intake_type' => 'visitor', 'intake_id' => $target->id,
            ])
            ->assertSessionHasNoErrors();

        // Only the target is gone; everything else is untouched.
        $this->assertSoftDeleted('leads', ['id' => $target->id]);
        $this->assertDatabaseHas('leads', ['id' => $otherDraft->id, 'deleted_at' => null]);
        $this->assertDatabaseHas('leads', ['id' => $free->id, 'deleted_at' => null]);
        $this->assertDatabaseHas('visitor_intakes', ['id' => $intake->id]);
    }

    public function test_real_intake_deletion_still_works(): void
    {
        $intake = VisitorIntake::create([
            'intake_id' => 'VI-REAL', 'status' => 'Submitted',
            'first_name' => 'Real', 'family_name' => 'Submit', 'email' => 'real@example.com',
            'dob' => '1990-01-01', 'phone' => '+64 21 000 0000',
        ]);

        $this->actingAs($this->staff())
            ->delete('/portal/immigration/assessments', [
                'record' => 'intake', 'intake_type' => 'visitor', 'intake_id' => $intake->id,
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseMissing('visitor_intakes', ['id' => $intake->id]);
    }
}
