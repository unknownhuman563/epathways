<?php

namespace Tests\Feature;

use App\Models\AccommodationMessageTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as AssertInertia;
use Tests\TestCase;

class MessageTemplateTest extends TestCase
{
    use RefreshDatabase;

    private function staff(): User
    {
        return User::factory()->create(['role' => 'accommodation']);
    }

    public function test_index_lists_templates(): void
    {
        AccommodationMessageTemplate::create(['title' => 'Client Viewing', 'content' => 'Hey everyone…', 'notes' => null]);

        $this->actingAs($this->staff())->get('/portal/accommodation/message-templates')
            ->assertInertia(fn (AssertInertia $page) => $page
                ->component('portal/accommodation/MessageTemplates')
                ->has('templates', 1)
                ->where('templates.0.title', 'Client Viewing'));
    }

    public function test_store_creates_template(): void
    {
        $this->actingAs($this->staff())
            ->from('/portal/accommodation/message-templates')
            ->post('/portal/accommodation/message-templates', [
                'title' => 'Room photos', 'content' => 'https://drive.google.com/drive/folders/abc', 'notes' => 'Shared link',
            ])->assertRedirect();

        $this->assertDatabaseHas('accommodation_message_templates', ['title' => 'Room photos', 'notes' => 'Shared link']);
    }

    public function test_store_requires_title_and_content(): void
    {
        $this->actingAs($this->staff())
            ->from('/portal/accommodation/message-templates')
            ->post('/portal/accommodation/message-templates', [])
            ->assertSessionHasErrors(['title', 'content']);
    }

    public function test_update_template(): void
    {
        $t = AccommodationMessageTemplate::create(['title' => 'Old', 'content' => 'x']);

        $this->actingAs($this->staff())
            ->from('/portal/accommodation/message-templates')
            ->patch("/portal/accommodation/message-templates/{$t->id}", ['title' => 'New', 'content' => 'y'])
            ->assertRedirect();

        $this->assertEquals('New', $t->fresh()->title);
        $this->assertEquals('y', $t->fresh()->content);
    }

    public function test_destroy_template(): void
    {
        $t = AccommodationMessageTemplate::create(['title' => 'Bye', 'content' => 'x']);

        $this->actingAs($this->staff())
            ->delete("/portal/accommodation/message-templates/{$t->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('accommodation_message_templates', ['id' => $t->id]);
    }
}
