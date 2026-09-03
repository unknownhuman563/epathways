<?php

namespace Tests\Feature\Dtr;

use App\Models\DtrEntry;
use App\Models\DtrSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DtrChangesTest extends TestCase
{
    use RefreshDatabase;

    private function mkSetting(User $u, array $over = []): DtrSetting
    {
        return DtrSetting::create(array_merge([
            'user_id' => $u->id, 'label' => 'Std', 'team' => 'Philippines', 'timezone' => 'Asia/Manila',
            'sched_in' => '08:00', 'sched_out' => '17:00', 'schedule_type' => 'fixed',
            'std_hours' => 8, 'grace_mins' => 10, 'break_hours' => 1, 'is_complete' => true,
        ], $over));
    }

    public function test_completing_a_task_records_a_realtime_timestamp(): void
    {
        $u = User::factory()->create(['role' => 'sales']);
        $this->mkSetting($u);
        $today = now('Asia/Manila')->toDateString();

        $this->actingAs($u)->post('/dtr/entry', [
            'work_date' => $today,
            'tasks' => [['task' => 'Called 5 leads', 'status' => 'done']],
        ])->assertRedirect();

        $entry = DtrEntry::where('user_id', $u->id)->whereDate('work_date', $today)->first();
        $this->assertNotEmpty($entry->tasks[0]['completed_at']);
        $stamped = $entry->tasks[0]['completed_at'];

        // Re-saving the same done task preserves the original stamp (not re-stamped).
        $this->actingAs($u)->post('/dtr/entry', [
            'work_date' => $today,
            'tasks' => [['task' => 'Called 5 leads', 'status' => 'done', 'completed_at' => $stamped]],
        ]);
        $this->assertSame($stamped, DtrEntry::where('user_id', $u->id)->whereDate('work_date', $today)->first()->tasks[0]['completed_at']);
    }

    public function test_archive_and_restore_staff(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $staff = User::factory()->create(['role' => 'sales']);
        $this->mkSetting($staff);

        $this->actingAs($admin)->post('/admin/dtr/archive', ['user_ids' => [$staff->id]])->assertRedirect();
        $this->assertNotNull($staff->fresh() && DtrSetting::where('user_id', $staff->id)->first()->archived_at);

        $this->actingAs($admin)->post('/admin/dtr/archive', ['user_ids' => [$staff->id], 'restore' => true]);
        $this->assertNull(DtrSetting::where('user_id', $staff->id)->first()->archived_at);
    }

    public function test_archiving_a_never_setup_user_creates_a_stub_row(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $staff = User::factory()->create(['role' => 'sales']); // no DtrSetting

        $this->actingAs($admin)->post('/admin/dtr/archive', ['user_ids' => [$staff->id]])->assertRedirect();
        $row = DtrSetting::where('user_id', $staff->id)->first();
        $this->assertNotNull($row);
        $this->assertNotNull($row->archived_at);
    }

    public function test_non_admin_cannot_archive(): void
    {
        $staff = User::factory()->create(['role' => 'sales']);
        $other = User::factory()->create(['role' => 'sales']);
        $this->actingAs($staff)->post('/admin/dtr/archive', ['user_ids' => [$other->id]])->assertForbidden();
    }
}
