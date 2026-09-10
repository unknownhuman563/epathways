<?php
namespace Tests\Feature;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class EnglishPreviewRouteTest extends TestCase
{
    use RefreshDatabase;
    public function test_offshore_english_preview_honours_custom_fee(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $lead = Lead::create(['first_name' => 'A', 'last_name' => 'B']);
        $res = $this->actingAs($admin)->get("/admin/leads/{$lead->id}/generate/english_offshore/preview?currency=nzd&english_fee=1000");
        $res->assertOk();
        $this->assertStringContainsString('1,000', $res->getContent());
        $this->assertStringNotContainsString('NZD $550', $res->getContent());
    }
}
