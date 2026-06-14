<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserReview;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserReviewModerationTest extends TestCase
{
    use RefreshDatabase;

    private function review(string $department = 'immigration'): UserReview
    {
        return UserReview::create([
            'review_id'    => 'UR-TEST-' . strtoupper($department),
            'name'         => 'Test Reviewer',
            'mode'         => 'paragraph',
            'paragraph'    => 'Great service.',
            'status'       => 'New',
            'is_published' => false,
            'department'   => $department,
        ]);
    }

    public function test_wrong_role_cannot_moderate_immigration_review(): void
    {
        $review = $this->review('immigration');
        $sales = User::factory()->create(['role' => 'sales']);

        $this->actingAs($sales)
            ->post("/admin/immigration/user-reviews/{$review->id}", ['is_published' => true])
            ->assertForbidden();

        $this->assertFalse($review->fresh()->is_published);
    }

    public function test_immigration_role_can_moderate_immigration_review(): void
    {
        $review = $this->review('immigration');
        $immigration = User::factory()->create(['role' => 'immigration']);

        $this->actingAs($immigration)
            ->post("/admin/immigration/user-reviews/{$review->id}", ['is_published' => true])
            ->assertRedirect();

        $this->assertTrue($review->fresh()->is_published);
    }

    public function test_wrong_role_cannot_moderate_education_review(): void
    {
        $review = $this->review('education');
        $immigration = User::factory()->create(['role' => 'immigration']);

        $this->actingAs($immigration)
            ->post("/admin/education/user-reviews/{$review->id}", ['is_published' => true])
            ->assertForbidden();

        $this->assertFalse($review->fresh()->is_published);
    }

    public function test_education_role_can_moderate_education_review(): void
    {
        $review = $this->review('education');
        $education = User::factory()->create(['role' => 'education']);

        $this->actingAs($education)
            ->post("/admin/education/user-reviews/{$review->id}", ['is_published' => true])
            ->assertRedirect();

        $this->assertTrue($review->fresh()->is_published);
    }

    public function test_admin_can_moderate_either_department(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $imm = $this->review('immigration');
        $edu = $this->review('education');

        $this->actingAs($admin)
            ->post("/admin/immigration/user-reviews/{$imm->id}", ['is_published' => true])
            ->assertRedirect();
        $this->actingAs($admin)
            ->post("/admin/education/user-reviews/{$edu->id}", ['is_published' => true])
            ->assertRedirect();

        $this->assertTrue($imm->fresh()->is_published);
        $this->assertTrue($edu->fresh()->is_published);
    }
}
