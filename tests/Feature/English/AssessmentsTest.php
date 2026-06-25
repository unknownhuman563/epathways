<?php

namespace Tests\Feature\English;

use App\Models\EnglishAssessment;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AssessmentsTest extends TestCase
{
    use RefreshDatabase;

    private function englishUser(): User
    {
        return User::factory()->create(['role' => 'english']);
    }

    private function learner(): Lead
    {
        return Lead::create([
            'first_name'         => 'Eng',
            'last_name'          => 'Learner',
            'is_english_student' => true,
        ]);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'lead_id'         => $this->learner()->id,
            'assessment_type' => 'mock',
            'assessment_date' => '2026-06-10',
            'overall_score'   => 75,
            'passed'          => true,
        ], $overrides);
    }

    public function test_list_page_renders_200(): void
    {
        $this->actingAs($this->englishUser())
            ->get('/portal/english/assessments')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('portal/english/Assessments')
                ->has('assessments')
                ->has('stats')
                ->has('types')
                ->has('learnerOptions')
            );
    }

    public function test_record_assessment_succeeds_with_valid_data(): void
    {
        $lead = $this->learner();

        $this->actingAs($this->englishUser())
            ->post('/portal/english/assessments', $this->payload(['lead_id' => $lead->id]))
            ->assertRedirect();

        $this->assertDatabaseHas('english_assessments', [
            'lead_id'         => $lead->id,
            'assessment_type' => 'mock',
            'overall_score'   => 75,
        ]);
    }

    public function test_lead_must_be_english_student(): void
    {
        $nonEnglish = Lead::create(['first_name' => 'Not', 'last_name' => 'English', 'is_english_student' => false]);

        $this->actingAs($this->englishUser())
            ->post('/portal/english/assessments', $this->payload(['lead_id' => $nonEnglish->id]))
            ->assertSessionHasErrors('lead_id');

        $this->assertDatabaseCount('english_assessments', 0);
    }

    public function test_score_range_validation(): void
    {
        $user = $this->englishUser();
        $lead = $this->learner();

        // PTE-style: 0–90. 95 is out of range.
        $this->actingAs($user)
            ->post('/portal/english/assessments', $this->payload(['lead_id' => $lead->id, 'assessment_type' => 'mock', 'overall_score' => 95]))
            ->assertSessionHasErrors('overall_score');

        // PTE-style: 85 is fine.
        $this->actingAs($user)
            ->post('/portal/english/assessments', $this->payload(['lead_id' => $lead->id, 'assessment_type' => 'mock', 'overall_score' => 85]))
            ->assertSessionHasNoErrors();

        // "other" (IELTS-style): 0–9. 9.5 is out of range.
        $this->actingAs($user)
            ->post('/portal/english/assessments', $this->payload(['lead_id' => $lead->id, 'assessment_type' => 'other', 'overall_score' => 9.5]))
            ->assertSessionHasErrors('overall_score');

        // "other": 8.5 is fine.
        $this->actingAs($user)
            ->post('/portal/english/assessments', $this->payload(['lead_id' => $lead->id, 'assessment_type' => 'other', 'overall_score' => 8.5]))
            ->assertSessionHasNoErrors();
    }

    public function test_update_assessment_persists_changes(): void
    {
        $lead = $this->learner();
        $a = EnglishAssessment::create($this->payload(['lead_id' => $lead->id]));

        $this->actingAs($this->englishUser())
            ->put("/portal/english/assessments/{$a->id}", $this->payload([
                'lead_id'       => $lead->id,
                'overall_score' => 88,
                'passed'        => false,
            ]))
            ->assertRedirect();

        $this->assertDatabaseHas('english_assessments', ['id' => $a->id, 'overall_score' => 88, 'passed' => false]);
    }

    public function test_soft_delete_works(): void
    {
        $a = EnglishAssessment::create($this->payload());

        $this->actingAs($this->englishUser())
            ->delete("/portal/english/assessments/{$a->id}")
            ->assertRedirect();

        $this->assertSoftDeleted('english_assessments', ['id' => $a->id]);
    }

    public function test_filter_by_type(): void
    {
        EnglishAssessment::create($this->payload(['assessment_type' => 'mock']));
        EnglishAssessment::create($this->payload(['assessment_type' => 'official_pte']));

        $this->actingAs($this->englishUser())
            ->get('/portal/english/assessments?type=official_pte')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('assessments', 1)
                ->where('assessments.0.assessment_type', 'official_pte')
            );
    }

    public function test_filter_by_date_range(): void
    {
        EnglishAssessment::create($this->payload(['assessment_date' => '2026-01-15']));
        EnglishAssessment::create($this->payload(['assessment_date' => '2026-06-15']));

        $this->actingAs($this->englishUser())
            ->get('/portal/english/assessments?date_from=2026-06-01&date_to=2026-06-30')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('assessments', 1)
                ->where('assessments.0.assessment_date', '2026-06-15')
            );
    }

    public function test_non_english_role_gets_403(): void
    {
        $a = EnglishAssessment::create($this->payload());
        $sales = User::factory()->create(['role' => 'sales']);

        $this->actingAs($sales)->get('/portal/english/assessments')->assertForbidden();
        $this->actingAs($sales)->post('/portal/english/assessments', $this->payload())->assertForbidden();
        $this->actingAs($sales)->put("/portal/english/assessments/{$a->id}", $this->payload())->assertForbidden();
        $this->actingAs($sales)->delete("/portal/english/assessments/{$a->id}")->assertForbidden();
    }
}
