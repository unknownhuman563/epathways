<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeamProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_team_profile_route_renders_inertia_page_with_slug(): void
    {
        $response = $this->get('/team/dinah-suarin');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('team/TeamProfilePage')
            ->where('slug', 'dinah-suarin')
        );
    }

    public function test_team_profile_route_is_public(): void
    {
        // No auth — must not redirect to login.
        $this->get('/team/anyone')->assertOk();
    }

    public function test_admin_team_cards_requires_auth(): void
    {
        // Guest is redirected to login, not served the page.
        $this->get('/admin/team-cards')->assertRedirect('/login');
    }

    public function test_admin_team_cards_renders_for_admin(): void
    {
        $response = $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->get('/admin/team-cards');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('admin/TeamCards'));
    }
}
