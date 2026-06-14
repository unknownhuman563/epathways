<?php

namespace Tests\Feature\English;

use App\Models\EnglishClass;
use App\Models\EnglishClassEnrollment;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ClassesTest extends TestCase
{
    use RefreshDatabase;

    private function englishUser(): User
    {
        return User::factory()->create(['role' => 'english']);
    }

    private function englishLearner(): Lead
    {
        return Lead::create([
            'first_name'         => 'Eng',
            'last_name'          => 'Learner',
            'is_english_student' => true,
        ]);
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'name'          => 'Morning PTE Group',
            'schedule_text' => 'Mon/Wed 6-8pm',
            'capacity'      => 10,
            'status'        => 'scheduled',
        ], $overrides);
    }

    public function test_list_page_renders_200(): void
    {
        EnglishClass::create($this->validPayload());

        $this->actingAs($this->englishUser())
            ->get('/portal/english/classes')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('portal/english/Classes')
                ->has('classes', 1)
                ->has('statuses')
                ->has('learnerOptions')
                ->has('instructorOptions')
            );
    }

    public function test_create_class_succeeds_with_valid_data(): void
    {
        $this->actingAs($this->englishUser())
            ->post('/portal/english/classes', $this->validPayload())
            ->assertRedirect();

        $this->assertDatabaseHas('english_classes', ['name' => 'Morning PTE Group', 'status' => 'scheduled']);
    }

    public function test_create_class_fails_validation_when_required_missing(): void
    {
        $this->actingAs($this->englishUser())
            ->post('/portal/english/classes', ['schedule_text' => 'whenever'])
            ->assertSessionHasErrors(['name', 'status']);

        $this->assertDatabaseCount('english_classes', 0);
    }

    public function test_update_class_persists_changes(): void
    {
        $class = EnglishClass::create($this->validPayload());

        $this->actingAs($this->englishUser())
            ->put("/portal/english/classes/{$class->id}", $this->validPayload([
                'name'   => 'Evening PTE Group',
                'status' => 'in_progress',
            ]))
            ->assertRedirect();

        $this->assertDatabaseHas('english_classes', [
            'id'     => $class->id,
            'name'   => 'Evening PTE Group',
            'status' => 'in_progress',
        ]);
    }

    public function test_soft_delete_class_works(): void
    {
        $class = EnglishClass::create($this->validPayload());

        $this->actingAs($this->englishUser())
            ->delete("/portal/english/classes/{$class->id}")
            ->assertRedirect();

        $this->assertSoftDeleted('english_classes', ['id' => $class->id]);
    }

    public function test_enroll_learner_succeeds_when_english_student(): void
    {
        $class = EnglishClass::create($this->validPayload());
        $lead = $this->englishLearner();

        $this->actingAs($this->englishUser())
            ->post("/portal/english/classes/{$class->id}/enroll", ['lead_id' => $lead->id])
            ->assertRedirect();

        $this->assertDatabaseHas('english_class_enrollments', [
            'english_class_id' => $class->id,
            'lead_id'          => $lead->id,
            'status'           => 'active',
        ]);
    }

    public function test_enroll_learner_fails_when_not_english_student(): void
    {
        $class = EnglishClass::create($this->validPayload());
        $lead = Lead::create(['first_name' => 'Not', 'last_name' => 'English', 'is_english_student' => false]);

        $this->actingAs($this->englishUser())
            ->post("/portal/english/classes/{$class->id}/enroll", ['lead_id' => $lead->id])
            ->assertSessionHasErrors('lead_id');

        $this->assertDatabaseCount('english_class_enrollments', 0);
    }

    public function test_withdraw_learner_removes_enrollment(): void
    {
        $class = EnglishClass::create($this->validPayload());
        $lead = $this->englishLearner();
        $enrollment = EnglishClassEnrollment::create([
            'english_class_id' => $class->id,
            'lead_id'          => $lead->id,
            'status'           => 'active',
            'enrolled_at'      => now(),
        ]);

        $this->actingAs($this->englishUser())
            ->delete("/portal/english/classes/{$class->id}/enroll/{$enrollment->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('english_class_enrollments', ['id' => $enrollment->id]);
    }

    public function test_non_english_role_gets_403(): void
    {
        $class = EnglishClass::create($this->validPayload());
        $sales = User::factory()->create(['role' => 'sales']);

        $this->actingAs($sales)->get('/portal/english/classes')->assertForbidden();
        $this->actingAs($sales)->post('/portal/english/classes', $this->validPayload())->assertForbidden();
        $this->actingAs($sales)->put("/portal/english/classes/{$class->id}", $this->validPayload())->assertForbidden();
        $this->actingAs($sales)->delete("/portal/english/classes/{$class->id}")->assertForbidden();
        $this->actingAs($sales)->post("/portal/english/classes/{$class->id}/enroll", ['lead_id' => 1])->assertForbidden();
    }
}
