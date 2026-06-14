<?php

namespace Tests\Feature\Profile;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AvatarUploadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    private function user(): User
    {
        return User::factory()->create(['role' => 'sales']);
    }

    public function test_upload_valid_jpg_sets_path_and_saves_file(): void
    {
        $user = $this->user();

        $this->actingAs($user)
            ->post('/profile/avatar', ['avatar' => UploadedFile::fake()->image('me.jpg', 500, 500)])
            ->assertRedirect();

        $user->refresh();
        $this->assertSame("avatars/{$user->id}.jpg", $user->avatar_path);
        Storage::disk('public')->assertExists($user->avatar_path);
    }

    public function test_invalid_type_is_rejected(): void
    {
        $user = $this->user();

        $this->actingAs($user)
            ->post('/profile/avatar', ['avatar' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf')])
            ->assertSessionHasErrors('avatar');

        $this->assertNull($user->fresh()->avatar_path);
    }

    public function test_oversized_image_is_rejected(): void
    {
        $user = $this->user();

        // 6 MB against the 5 MB image cap.
        $this->actingAs($user)
            ->post('/profile/avatar', ['avatar' => UploadedFile::fake()->create('big.png', 6 * 1024, 'image/png')])
            ->assertSessionHasErrors('avatar');
    }

    public function test_upload_replaces_existing_avatar_and_deletes_old_file(): void
    {
        $user = $this->user();

        // First a JPG…
        $this->actingAs($user)->post('/profile/avatar', ['avatar' => UploadedFile::fake()->image('a.jpg', 400, 400)]);
        $old = $user->fresh()->avatar_path;
        Storage::disk('public')->assertExists($old);

        // …then a PNG (different extension → old file removed).
        $this->actingAs($user)->post('/profile/avatar', ['avatar' => UploadedFile::fake()->image('b.png', 400, 400)]);
        $new = $user->fresh()->avatar_path;

        $this->assertSame("avatars/{$user->id}.png", $new);
        $this->assertNotSame($old, $new);
        Storage::disk('public')->assertMissing($old);
        Storage::disk('public')->assertExists($new);
    }

    public function test_delete_removes_file_and_clears_path(): void
    {
        $user = $this->user();
        $this->actingAs($user)->post('/profile/avatar', ['avatar' => UploadedFile::fake()->image('a.jpg', 300, 300)]);
        $path = $user->fresh()->avatar_path;

        $this->actingAs($user)->delete('/profile/avatar')->assertRedirect();

        $this->assertNull($user->fresh()->avatar_path);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_avatar_url_falls_back_to_null_when_no_avatar(): void
    {
        $user = $this->user();
        $this->assertNull($user->avatar_url);

        $this->actingAs($user)->post('/profile/avatar', ['avatar' => UploadedFile::fake()->image('a.jpg', 300, 300)]);
        $this->assertNotNull($user->fresh()->avatar_url);
        $this->assertStringContainsString('avatars/', $user->fresh()->avatar_url);
    }

    public function test_guest_cannot_upload(): void
    {
        $this->post('/profile/avatar', ['avatar' => UploadedFile::fake()->image('a.jpg')])
            ->assertRedirect('/login');
    }
}
