<?php

namespace Tests\Feature\Communication;

use App\Models\MessageTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DepartmentTemplateTest extends TestCase
{
    use RefreshDatabase;

    private function tmpl(array $attrs = []): MessageTemplate
    {
        return MessageTemplate::create(array_merge([
            'key' => 'application_status_update', 'name' => 'Status', 'channels' => ['email'],
            'email_subject' => 'Hi {{first_name}}', 'email_body' => 'Status: {{status}}', 'is_active' => true,
        ], $attrs));
    }

    public function test_resolve_prefers_department_over_global(): void
    {
        $this->tmpl(['department' => '', 'name' => 'Global']);
        $this->tmpl(['department' => 'sales', 'name' => 'Sales']);

        $this->assertSame('Sales', MessageTemplate::resolve('application_status_update', 'sales')->name);
        // A department with no own copy falls back to the global one.
        $this->assertSame('Global', MessageTemplate::resolve('application_status_update', 'education')->name);
        // No department context → global only.
        $this->assertSame('Global', MessageTemplate::resolve('application_status_update', null)->name);
    }

    public function test_same_key_allowed_across_departments(): void
    {
        $this->tmpl(['department' => 'sales']);
        $this->tmpl(['department' => 'education']);   // must not collide

        $this->assertSame(2, MessageTemplate::where('key', 'application_status_update')->count());
    }

    public function test_portal_lists_only_its_own_templates(): void
    {
        $this->tmpl(['department' => 'sales', 'name' => 'Sales One']);
        $this->tmpl(['department' => 'education', 'name' => 'Edu One']);
        $this->tmpl(['department' => '', 'name' => 'Global One']);

        $this->actingAs(User::factory()->create(['role' => 'sales']))
            ->get('/portal/sales/email-templates')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->component('portal/sales/EmailTemplates')
                ->has('templates', 1)
                ->where('templates.0.name', 'Sales One'));
    }

    public function test_admin_browsing_a_portal_sees_that_departments_scope(): void
    {
        $this->tmpl(['department' => 'sales', 'name' => 'Sales One']);
        $this->tmpl(['department' => 'education', 'name' => 'Edu One']);

        // An admin opening the sales portal page stays in the sales scope and
        // the sales (portal) component — not the admin view.
        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->get('/portal/sales/email-templates')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->component('portal/sales/EmailTemplates')
                ->has('templates', 1)
                ->where('templates.0.name', 'Sales One'));
    }

    public function test_portal_create_forces_own_department(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'education']))
            ->post('/portal/education/email-templates', [
                'key' => 'edu_note', 'name' => 'Edu Note', 'channels' => ['email'],
                'email_subject' => 'S', 'email_body' => 'B', 'department' => 'sales', // attempt to spoof
            ])->assertRedirect();

        // Department is forced to the acting portal, ignoring the posted value.
        $this->assertDatabaseHas('message_templates', ['key' => 'edu_note', 'department' => 'education']);
        $this->assertDatabaseMissing('message_templates', ['key' => 'edu_note', 'department' => 'sales']);
    }

    public function test_staff_cannot_touch_another_departments_template(): void
    {
        $sales = $this->tmpl(['department' => 'sales']);
        $global = $this->tmpl(['department' => '', 'key' => 'doc_x']);

        $edu = User::factory()->create(['role' => 'education']);
        $this->actingAs($edu)->get("/portal/education/email-templates/{$sales->id}")->assertForbidden();
        // Staff manage only their own department — not the shared/global set.
        $this->actingAs($edu)->get("/portal/education/email-templates/{$global->id}")->assertForbidden();
    }

    public function test_immigration_subrole_resolves_to_immigration_department(): void
    {
        $this->tmpl(['department' => 'immigration', 'name' => 'Imm One']);

        $this->actingAs(User::factory()->create(['role' => 'immigration_manager']))
            ->get('/portal/immigration/email-templates')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->component('portal/immigration/EmailTemplates')
                ->has('templates', 1)
                ->where('templates.0.name', 'Imm One'));
    }
}
