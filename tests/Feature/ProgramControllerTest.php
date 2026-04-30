<?php

namespace Tests\Feature;

use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProgramControllerTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create();
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'NZ Diploma in Enrolled Nursing',
            'institution' => 'Wintec',
            'location' => 'Auckland',
            'level' => 5,
            'category' => 'diplomas',
            'status' => 'published',
            'price_text' => 'Contact for price',
            'description' => 'About this program.',
            'intake_months' => 'February, July',
            'duration_months' => 18,
            'credits' => 180,
            'residency_points' => 3,
            'hours_per_week' => 25,
            'entry_requirements' => 'NCEA Level 2.',
            'specialization' => 'Clinical practice.',
            'employment_outcomes' => [
                ['intro' => 'Hospitals.', 'bullets' => []],
            ],
            'post_study' => 'PSWV.',
            'other_benefits' => ['Free uniform', 'Industry mentor'],
            'fee_guide' => [
                ['region' => 'India & Subcontinent', 'fee' => 31200],
                ['region' => 'Southeast Asia', 'fee' => 31200],
            ],
            'insurance_fee' => 1000,
            'visa_processing_fee' => 2350,
            'living_expense' => 20000,
            'accommodation' => 'from $180/week',
        ], $overrides);
    }

    public function test_admin_index_requires_auth(): void
    {
        $this->get('/admin/programs')->assertRedirect('/login');
    }

    public function test_admin_can_list_programs(): void
    {
        Program::create($this->payload());

        $response = $this->actingAs($this->admin())->get('/admin/programs');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Programs')
            ->has('programs', 1)
        );
    }

    public function test_admin_can_create_program_with_image(): void
    {
        Storage::fake('public');

        $payload = $this->payload();
        $payload['image'] = UploadedFile::fake()->create('banner.jpg', 100, 'image/jpeg');

        $response = $this->actingAs($this->admin())->post('/admin/programs', $payload);

        $response->assertRedirect();
        $this->assertDatabaseHas('programs', ['title' => 'NZ Diploma in Enrolled Nursing']);
        $program = Program::first();
        $this->assertNotNull($program->image);
        Storage::disk('public')->assertExists($program->image);
    }

    public function test_admin_create_validates_required_fields(): void
    {
        $response = $this->actingAs($this->admin())->post('/admin/programs', []);

        $response->assertSessionHasErrors(['title', 'level', 'category', 'status']);
    }

    public function test_admin_can_update_program(): void
    {
        $program = Program::create($this->payload());

        $response = $this->actingAs($this->admin())
            ->post('/admin/programs/'.$program->id, $this->payload(['title' => 'Updated Title']));

        $response->assertRedirect();
        $this->assertDatabaseHas('programs', ['id' => $program->id, 'title' => 'Updated Title']);
    }

    public function test_admin_update_keeps_existing_image_when_no_new_file(): void
    {
        Storage::fake('public');
        $program = Program::create($this->payload(['image' => 'programs/banners/old.jpg']));
        Storage::disk('public')->put('programs/banners/old.jpg', 'fake');

        $this->actingAs($this->admin())
            ->post('/admin/programs/'.$program->id, $this->payload(['title' => 'Renamed']));

        $program->refresh();
        $this->assertSame('programs/banners/old.jpg', $program->image);
    }

    public function test_admin_can_delete_program(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('programs/banners/x.jpg', 'fake');
        $program = Program::create($this->payload(['image' => 'programs/banners/x.jpg']));

        $response = $this->actingAs($this->admin())->delete('/admin/programs/'.$program->id);

        $response->assertRedirect();
        $this->assertDatabaseMissing('programs', ['id' => $program->id]);
        Storage::disk('public')->assertMissing('programs/banners/x.jpg');
    }

    public function test_public_index_only_shows_published(): void
    {
        Program::create($this->payload(['title' => 'Published', 'status' => 'published']));
        Program::create($this->payload(['title' => 'Draft', 'status' => 'draft']));
        Program::create($this->payload(['title' => 'Archived', 'status' => 'archived']));

        $response = $this->get('/programs-levels');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('ProgramsLevels')
            ->has('programs', 1)
            ->where('programs.0.title', 'Published')
        );
    }

    public function test_public_show_returns_404_for_non_published(): void
    {
        $program = Program::create($this->payload(['status' => 'draft']));

        $this->get('/program-details/'.$program->id)->assertNotFound();
    }

    public function test_public_show_renders_published_program(): void
    {
        $program = Program::create($this->payload(['status' => 'published']));

        $response = $this->get('/program-details/'.$program->id);

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('ProgramDetails')
            ->where('program.id', $program->id)
        );
    }
}
