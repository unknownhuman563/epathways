<?php

namespace Tests\Feature;

use App\Mail\TemplatedMessage;
use App\Models\MessageTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MessageTemplateBrandingTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    public function test_store_accepts_optional_banner_and_footer_images(): void
    {
        Storage::fake('public');

        $this->actingAs($this->admin())
            ->from('/admin/message-templates')
            ->post('/admin/message-templates', [
                'key' => 'welcome_branded',
                'name' => 'Welcome (branded)',
                'department' => '',
                'channels' => ['email'],
                'email_subject' => 'Welcome {{first_name}}',
                'email_body' => '# Hi {{first_name}}',
                'is_active' => true,
                'banner_image' => UploadedFile::fake()->image('banner.png', 600, 200),
                'footer_image' => UploadedFile::fake()->image('footer.png', 520, 300),
            ])->assertRedirect();

        $template = MessageTemplate::where('key', 'welcome_branded')->first();
        $this->assertNotNull($template);
        $this->assertNotNull($template->banner_image);
        $this->assertNotNull($template->footer_image);
        Storage::disk('public')->assertExists($template->banner_image);
        Storage::disk('public')->assertExists($template->footer_image);
    }

    public function test_images_are_optional(): void
    {
        Storage::fake('public');

        $this->actingAs($this->admin())
            ->from('/admin/message-templates')
            ->post('/admin/message-templates', [
                'key' => 'plain_template',
                'name' => 'Plain',
                'department' => '',
                'channels' => ['email'],
                'email_subject' => 'Hi',
                'email_body' => 'Body',
                'is_active' => true,
            ])->assertRedirect();

        $template = MessageTemplate::where('key', 'plain_template')->first();
        $this->assertNull($template->banner_image);
        $this->assertNull($template->footer_image);
    }

    public function test_remove_flag_clears_saved_banner(): void
    {
        Storage::fake('public');
        $path = UploadedFile::fake()->image('b.png')->store('templates/banners', 'public');
        $template = MessageTemplate::create([
            'key' => 'has_banner', 'name' => 'Has banner', 'department' => '',
            'channels' => ['email'], 'email_subject' => 'x', 'email_body' => 'y',
            'banner_image' => $path, 'is_active' => true,
        ]);

        $this->actingAs($this->admin())
            ->from("/admin/message-templates/{$template->id}")
            ->put("/admin/message-templates/{$template->id}", [
                'name' => 'Has banner', 'channels' => ['email'],
                'email_subject' => 'x', 'email_body' => 'y', 'is_active' => true,
                'remove_banner' => true,
            ])->assertRedirect();

        $this->assertNull($template->fresh()->banner_image);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_templated_message_renders_branded_shell_and_embeds_images(): void
    {
        $html = (new TemplatedMessage('Subject', '# Hello **world**', []))->render();

        // Images are embedded inline (data-URI on render / CID on send), not
        // linked by URL, so they load in every mail client regardless of host.
        $this->assertMatchesRegularExpression('/src="(data:image|cid:)/', $html);
        $this->assertStringContainsString('BOOK NOW', $html);
        $this->assertStringContainsString('Hello', $html);
        $this->assertStringContainsString('Location', $html);
    }
}
