<?php

namespace Tests\Feature\Leads;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ConvertedLeadsHiddenTest extends TestCase
{
    use RefreshDatabase;

    public function test_education_leads_list_excludes_converted_students(): void
    {
        $pipeline = Lead::create(['first_name' => 'Still', 'last_name' => 'Pipeline']);
        $student  = Lead::create(['first_name' => 'Gone', 'last_name' => 'ToStudent', 'is_student' => true]);

        $this->actingAs(User::factory()->create(['role' => 'education']))
            ->get('/portal/education/leads')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->has('leads', 1)
                ->where('leads.0.id', $pipeline->id));
    }

    public function test_immigration_leads_list_excludes_converted_cases(): void
    {
        $pipeline = Lead::create(['first_name' => 'Still', 'last_name' => 'Pipeline']);
        Lead::create(['first_name' => 'Gone', 'last_name' => 'ToCase', 'is_immigration_case' => true]);

        $this->actingAs(User::factory()->create(['role' => 'immigration']))
            ->get('/portal/immigration/leads')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->has('leads', 1));
    }

    public function test_admin_and_sales_lists_already_exclude_converted(): void
    {
        Lead::create(['first_name' => 'A', 'last_name' => 'Pipeline']);
        Lead::create(['first_name' => 'B', 'last_name' => 'Converted', 'is_student' => true]);

        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->get('/admin/leads')
            ->assertInertia(fn (Assert $p) => $p->has('leads', 1));

        $sales = User::factory()->create(['role' => 'sales']);
        $this->actingAs($sales)->get('/portal/sales/leads')
            ->assertInertia(fn (Assert $p) => $p->has('leads', 1));
    }
}
