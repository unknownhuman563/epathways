<?php

namespace Tests\Feature;

use App\Models\FacebookLiveSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FacebookLiveControllerTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create();
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'title'        => 'Visa interview tips',
            'description'  => 'Prepare for your visa interview with confidence.',
            'fb_link'      => 'https://www.facebook.com/share/v/AbCdEf123/',
            'session_date' => now()->subWeek()->toDateString(),
        ], $overrides);
    }

    public function test_admin_index_requires_auth(): void
    {
        $this->get('/admin/facebook-live')->assertRedirect('/login');
    }

    public function test_admin_can_list_sessions(): void
    {
        FacebookLiveSession::create($this->payload());

        $response = $this->actingAs($this->admin())->get('/admin/facebook-live');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/FacebookLive')
            ->has('sessions', 1)
        );
    }

    public function test_admin_can_create_session_with_image(): void
    {
        Storage::fake('public');

        $payload = $this->payload();
        $payload['image'] = UploadedFile::fake()->create('cover.jpg', 100, 'image/jpeg');

        $response = $this->actingAs($this->admin())->post('/admin/facebook-live', $payload);

        $response->assertRedirect();
        $this->assertDatabaseHas('facebook_live_sessions', ['title' => 'Visa interview tips']);
        $session = FacebookLiveSession::first();
        $this->assertNotNull($session->image);
        Storage::disk('public')->assertExists($session->image);
    }

    public function test_admin_create_validates_required_fields(): void
    {
        $response = $this->actingAs($this->admin())->post('/admin/facebook-live', []);

        $response->assertSessionHasErrors(['title', 'description', 'fb_link', 'session_date']);
    }

    public function test_admin_create_validates_fb_link_is_url(): void
    {
        $response = $this->actingAs($this->admin())
            ->post('/admin/facebook-live', $this->payload(['fb_link' => 'not-a-url']));

        $response->assertSessionHasErrors(['fb_link']);
    }

    public function test_admin_can_update_session(): void
    {
        $session = FacebookLiveSession::create($this->payload());

        $response = $this->actingAs($this->admin())
            ->post('/admin/facebook-live/'.$session->id, $this->payload(['title' => 'Updated title']));

        $response->assertRedirect();
        $this->assertDatabaseHas('facebook_live_sessions', ['id' => $session->id, 'title' => 'Updated title']);
    }

    public function test_admin_update_keeps_existing_image_when_no_new_file(): void
    {
        Storage::fake('public');
        $session = FacebookLiveSession::create($this->payload(['image' => 'facebook-live/images/old.jpg']));
        Storage::disk('public')->put('facebook-live/images/old.jpg', 'fake');

        $this->actingAs($this->admin())
            ->post('/admin/facebook-live/'.$session->id, $this->payload(['title' => 'Renamed']));

        $session->refresh();
        $this->assertSame('facebook-live/images/old.jpg', $session->image);
    }

    public function test_admin_update_replaces_image_and_deletes_old_file(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('facebook-live/images/old.jpg', 'fake');
        $session = FacebookLiveSession::create($this->payload(['image' => 'facebook-live/images/old.jpg']));

        $payload = $this->payload();
        $payload['image'] = UploadedFile::fake()->create('new.jpg', 100, 'image/jpeg');

        $this->actingAs($this->admin())
            ->post('/admin/facebook-live/'.$session->id, $payload);

        $session->refresh();
        Storage::disk('public')->assertMissing('facebook-live/images/old.jpg');
        $this->assertNotSame('facebook-live/images/old.jpg', $session->image);
        Storage::disk('public')->assertExists($session->image);
    }

    public function test_admin_can_delete_session_and_image(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('facebook-live/images/x.jpg', 'fake');
        $session = FacebookLiveSession::create($this->payload(['image' => 'facebook-live/images/x.jpg']));

        $response = $this->actingAs($this->admin())->delete('/admin/facebook-live/'.$session->id);

        $response->assertRedirect();
        $this->assertDatabaseMissing('facebook_live_sessions', ['id' => $session->id]);
        Storage::disk('public')->assertMissing('facebook-live/images/x.jpg');
    }

    public function test_activities_page_features_earliest_upcoming_when_available(): void
    {
        FacebookLiveSession::create($this->payload([
            'title'        => 'Past session',
            'session_date' => now()->subWeek()->toDateString(),
        ]));
        FacebookLiveSession::create($this->payload([
            'title'        => 'Earlier upcoming',
            'session_date' => now()->addDay()->toDateString(),
        ]));
        FacebookLiveSession::create($this->payload([
            'title'        => 'Later upcoming',
            'session_date' => now()->addMonth()->toDateString(),
        ]));

        $response = $this->get('/activities');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Activities')
            ->where('featuredSession.title', 'Earlier upcoming')
            ->has('pastSessions', 1)
            ->where('pastSessions.0.title', 'Past session')
        );
    }

    public function test_activities_page_falls_back_to_most_recent_past_when_no_upcoming(): void
    {
        FacebookLiveSession::create($this->payload([
            'title'        => 'Older past',
            'session_date' => now()->subMonth()->toDateString(),
        ]));
        FacebookLiveSession::create($this->payload([
            'title'        => 'Recent past',
            'session_date' => now()->subDay()->toDateString(),
        ]));

        $response = $this->get('/activities');

        $response->assertInertia(fn ($page) => $page
            ->where('featuredSession.title', 'Recent past')
            ->has('pastSessions', 1)
            ->where('pastSessions.0.title', 'Older past')
        );
    }

    public function test_activities_page_returns_null_featured_when_no_sessions(): void
    {
        $response = $this->get('/activities');

        $response->assertInertia(fn ($page) => $page
            ->where('featuredSession', null)
            ->has('pastSessions', 0)
        );
    }
}
