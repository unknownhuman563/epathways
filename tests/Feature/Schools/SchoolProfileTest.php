<?php

namespace Tests\Feature\Schools;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SchoolProfileTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $over = []): array
    {
        return array_merge([
            'name' => 'Auckland Institute of Studies',
            'country' => 'New Zealand',
            'city' => 'Auckland',
            'website' => 'https://www.ais.ac.nz',
            'status' => 'active',
            'contact_person_name' => 'Nicci Bernelle Aguilar',
            'contact_email' => 'nicci@ais.ac.nz',
            'contact_number' => '+639603180698',
            'portal_username' => 'dev@epathways.co.nz',
            'portal_password' => 'UP.ep2024',
            'portal_link' => 'https://enroller.app/new-zealand',
        ], $over);
    }

    public function test_admin_can_create_school_with_contact_portal_and_agreement(): void
    {
        Storage::fake('local');
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->post('/admin/schools', $this->payload([
            'agreement_file' => UploadedFile::fake()->create('agreement.pdf', 100, 'application/pdf'),
        ]))->assertRedirect();

        $school = School::first();
        $this->assertSame('Nicci Bernelle Aguilar', $school->contact_person_name);
        $this->assertSame('UP.ep2024', $school->portal_password);
        $this->assertNotNull($school->agreement_path);
        $this->assertSame('agreement.pdf', $school->agreement_name);
        Storage::disk('local')->assertExists($school->agreement_path);
    }

    public function test_profile_shows_all_data_and_admin_can_download_agreement(): void
    {
        Storage::fake('local');
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post('/admin/schools', $this->payload([
            'agreement_file' => UploadedFile::fake()->create('deal.pdf', 50, 'application/pdf'),
        ]));
        $school = School::first();

        $this->actingAs($admin)->get("/admin/schools/{$school->id}/profile")
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->component('admin/SchoolProfile')
                ->where('canViewAgreement', true)
                ->where('hasAgreement', true)
                ->where('school.portal_password', 'UP.ep2024')
            );

        $this->actingAs($admin)->get("/admin/schools/{$school->id}/agreement")->assertOk();
    }

    public function test_education_can_view_profile_but_not_download_agreement(): void
    {
        Storage::fake('local');
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post('/admin/schools', $this->payload([
            'agreement_file' => UploadedFile::fake()->create('deal.pdf', 50, 'application/pdf'),
        ]));
        $school = School::first();

        $edu = User::factory()->create(['role' => 'education']);
        $this->actingAs($edu)->get("/portal/education/schools/{$school->id}/profile")
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->where('canViewAgreement', false));

        $this->actingAs($edu)->get("/admin/schools/{$school->id}/agreement")->assertForbidden();
    }

    public function test_update_replaces_the_agreement_file(): void
    {
        Storage::fake('local');
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post('/admin/schools', $this->payload([
            'agreement_file' => UploadedFile::fake()->create('old.pdf', 20, 'application/pdf'),
        ]));
        $school = School::first();
        $oldPath = $school->agreement_path;

        $this->actingAs($admin)->post("/admin/schools/{$school->id}", $this->payload([
            'agreement_file' => UploadedFile::fake()->create('new.pdf', 30, 'application/pdf'),
        ]))->assertRedirect();

        $school->refresh();
        $this->assertSame('new.pdf', $school->agreement_name);
        $this->assertNotSame($oldPath, $school->agreement_path);
        Storage::disk('local')->assertMissing($oldPath);
        Storage::disk('local')->assertExists($school->agreement_path);
    }
}
