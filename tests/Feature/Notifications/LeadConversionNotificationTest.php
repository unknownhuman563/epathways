<?php

namespace Tests\Feature\Notifications;

use App\Models\Lead;
use App\Models\User;
use App\Notifications\LeadConvertedToDepartment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class LeadConversionNotificationTest extends TestCase
{
    use RefreshDatabase;

    private function lead(): Lead
    {
        return Lead::create(['first_name' => 'Conv', 'last_name' => 'Lead']);
    }

    private function actor(string $role = 'sales'): User
    {
        return User::factory()->create(['role' => $role]);
    }

    public function test_convert_to_student_notifies_education_team(): void
    {
        Notification::fake();
        $edu = User::factory()->create(['role' => 'education']);
        $other = User::factory()->create(['role' => 'accommodation']);
        $lead = $this->lead();

        $this->actingAs($this->actor('admin'))
            ->post("/admin/leads/{$lead->id}/convert-to-student")
            ->assertRedirect();

        Notification::assertSentTo($edu, LeadConvertedToDepartment::class, fn ($n) => $n->department === 'Education');
        Notification::assertNotSentTo($other, LeadConvertedToDepartment::class);
    }

    public function test_convert_to_case_notifies_immigration_team(): void
    {
        Notification::fake();
        $imm = User::factory()->create(['role' => 'immigration']);
        $lead = $this->lead();

        $this->actingAs($this->actor('admin'))
            ->post("/admin/leads/{$lead->id}/convert-to-case")
            ->assertRedirect();

        Notification::assertSentTo($imm, LeadConvertedToDepartment::class, fn ($n) => $n->department === 'Immigration');
    }

    public function test_convert_to_english_notifies_english_team(): void
    {
        Notification::fake();
        $eng = User::factory()->create(['role' => 'english']);
        $lead = $this->lead();

        $this->actingAs($this->actor('admin'))
            ->post("/admin/leads/{$lead->id}/convert-to-english")
            ->assertRedirect();

        Notification::assertSentTo($eng, LeadConvertedToDepartment::class, fn ($n) => $n->department === 'English');
    }

    public function test_convert_to_accommodation_notifies_accommodation_team(): void
    {
        Notification::fake();
        $acc = User::factory()->create(['role' => 'accommodation']);
        $lead = $this->lead();

        $this->actingAs($this->actor('admin'))
            ->post("/admin/leads/{$lead->id}/convert-to-accommodation")
            ->assertRedirect();

        Notification::assertSentTo($acc, LeadConvertedToDepartment::class, fn ($n) => $n->department === 'Accommodation');
    }

    public function test_falls_back_to_admins_when_department_empty(): void
    {
        Notification::fake();
        // No education users exist — only an admin.
        $admin = User::factory()->create(['role' => 'admin']);
        $lead = $this->lead();

        $this->actingAs($admin)
            ->post("/admin/leads/{$lead->id}/convert-to-student")
            ->assertRedirect();

        Notification::assertSentTo($admin, LeadConvertedToDepartment::class);
    }

    public function test_no_notification_when_already_converted(): void
    {
        Notification::fake();
        User::factory()->create(['role' => 'education']);
        $lead = Lead::create(['first_name' => 'Done', 'last_name' => 'Already', 'is_student' => true]);

        $this->actingAs($this->actor('admin'))
            ->post("/admin/leads/{$lead->id}/convert-to-student"); // returns "already a student"

        Notification::assertNothingSent();
    }
}
