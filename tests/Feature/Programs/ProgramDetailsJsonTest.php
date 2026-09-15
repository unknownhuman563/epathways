<?php

namespace Tests\Feature\Programs;

use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProgramDetailsJsonTest extends TestCase
{
    use RefreshDatabase;

    private function program(): Program
    {
        return Program::create([
            'title' => 'Bachelor of Business', 'slug' => 'bachelor-of-business',
            'level' => 7, 'location' => 'Auckland', 'category' => 'bachelors',
            'status' => 'published', 'duration_months' => 36, 'credits' => 360,
            'hours_per_week' => '25',
        ]);
    }

    public function test_staff_can_fetch_full_program_detail_json(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $p = $this->program();

        $this->actingAs($admin)->getJson("/admin/programs/{$p->id}/details")
            ->assertOk()
            ->assertJsonPath('program.title', 'Bachelor of Business')
            ->assertJsonPath('program.duration_months', 36)
            ->assertJsonPath('program.credits', 360)
            ->assertJsonPath('program.hours_per_week', '25');
    }

    public function test_details_endpoint_requires_authentication(): void
    {
        $p = $this->program();
        $this->getJson("/admin/programs/{$p->id}/details")->assertUnauthorized();
    }
}
