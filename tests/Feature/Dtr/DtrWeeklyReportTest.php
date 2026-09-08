<?php

namespace Tests\Feature\Dtr;

use App\Mail\DtrWeeklyReport;
use App\Models\DtrEntry;
use App\Models\DtrSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class DtrWeeklyReportTest extends TestCase
{
    use RefreshDatabase;

    private function mkSetting(User $u, array $over = []): DtrSetting
    {
        return DtrSetting::create(array_merge([
            'user_id' => $u->id, 'label' => 'Std', 'team' => 'Philippines', 'timezone' => 'Asia/Manila',
            'sched_in' => '08:00', 'sched_out' => '17:00', 'schedule_type' => 'fixed',
            'std_hours' => 8, 'grace_mins' => 10, 'break_hours' => 1, 'break_after' => 6, 'is_complete' => true,
        ], $over));
    }

    public function test_admin_can_download_the_weekly_pdf(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $staff = User::factory()->create(['role' => 'sales']);
        $this->mkSetting($staff);
        DtrEntry::create([
            'user_id' => $staff->id, 'work_date' => '2026-09-01',
            'time_in' => '08:00', 'time_out' => '17:00', 'tasks' => [['task' => 'x', 'status' => 'done']],
        ]);

        $res = $this->actingAs($admin)->get('/admin/dtr/weekly-report?week=2026-09-02&team=all');
        $res->assertOk();
        $this->assertSame('application/pdf', $res->headers->get('content-type'));
    }

    public function test_admin_can_email_the_weekly_report_with_attachment(): void
    {
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $staff = User::factory()->create(['role' => 'sales', 'name' => 'Ana Cruz']);
        $this->mkSetting($staff);
        DtrEntry::create([
            'user_id' => $staff->id, 'work_date' => '2026-09-01',
            'time_in' => '08:05', 'time_out' => '17:00', 'tasks' => [['task' => 'x', 'status' => 'done']],
        ]);

        $this->actingAs($admin)->post('/admin/dtr/weekly-report', [
            'week' => '2026-09-02',
            'team' => 'all',
            'recipients' => ['dev@epathways.co.nz', 'dinah@epathways.co.nz'],
            'greeting' => 'Dev and Dinah',
        ])->assertRedirect();

        Mail::assertSent(DtrWeeklyReport::class, function (DtrWeeklyReport $m) {
            return $m->hasTo('dev@epathways.co.nz')
                && $m->hasTo('dinah@epathways.co.nz')
                && $m->greeting === 'Dev and Dinah';
        });
    }

    public function test_send_requires_at_least_one_recipient(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post('/admin/dtr/weekly-report', [
            'week' => '2026-09-02', 'team' => 'all', 'recipients' => [],
        ])->assertSessionHasErrors('recipients');
    }

    public function test_staff_without_reports_access_are_forbidden(): void
    {
        $staff = User::factory()->create(['role' => 'sales']);
        $this->actingAs($staff)->get('/admin/dtr/weekly-report?week=2026-09-02&team=all')->assertForbidden();
        $this->actingAs($staff)->post('/admin/dtr/weekly-report', [
            'week' => '2026-09-02', 'team' => 'all', 'recipients' => ['x@y.com'],
        ])->assertForbidden();
    }
}
