<?php

namespace Tests\Feature;

use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Every category the Programs UI / validation offers must be storable — the
 * `category` enum once omitted "certificate", which passed validation but blew
 * up the insert on strict MySQL (1265 Data truncated). Guard all four.
 */
class ProgramCategoryEnumTest extends TestCase
{
    use RefreshDatabase;

    public static function categories(): array
    {
        return [['certificate'], ['diplomas'], ['bachelors'], ['masters']];
    }

    /** @dataProvider categories */
    public function test_staff_can_create_a_program_in_each_category(string $category): void
    {
        $user = User::factory()->create(['role' => 'education']);

        $this->actingAs($user)
            ->post('/portal/education/programs', [
                'title' => "Test {$category} programme",
                'level' => 5,
                'category' => $category,
                'status' => 'draft',
            ])
            ->assertStatus(302)
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('programs', ['category' => $category]);
    }
}
