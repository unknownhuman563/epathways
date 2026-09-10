<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocPickerSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_finds_a_pipeline_lead_by_name_beyond_the_alphabetical_cap(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        // Many A-name leads that would fill an alphabetical cap ahead of "Vipan".
        for ($i = 0; $i < 30; $i++) {
            Lead::create(['first_name' => 'Aaa'.$i, 'last_name' => 'Xyz', 'email' => "a{$i}@ex.com"]);
        }
        Lead::create(['first_name' => 'Vipan', 'last_name' => 'Maan', 'email' => 'vipanmaan4@gmail.com']);

        $res = $this->actingAs($admin)->getJson('/admin/leads/doc-picker-search?q=vipan');
        $res->assertOk();
        $names = collect($res->json('leads'))->pluck('name');
        $this->assertTrue($names->contains('Vipan Maan'));
    }

    public function test_excludes_immigration_cases(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Lead::create(['first_name' => 'Case', 'last_name' => 'Person', 'is_immigration_case' => true]);

        $res = $this->actingAs($admin)->getJson('/admin/leads/doc-picker-search?q=case');
        $this->assertCount(0, $res->json('leads'));
    }
}
