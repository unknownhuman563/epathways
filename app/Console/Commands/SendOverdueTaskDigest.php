<?php

namespace App\Console\Commands;

use App\Mail\OverdueTaskDigest;
use App\Models\LeadTask;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Emails each staff member a daily digest of the tasks assigned to them that
 * are now overdue (past due date, still open) — ClickUp-style. Scheduled in
 * routes/console.php; runs once a day.
 */
class SendOverdueTaskDigest extends Command
{
    protected $signature = 'tasks:overdue-digest';

    protected $description = 'Email each staff member their list of overdue tasks';

    public function handle(): int
    {
        $now = now();

        $tasks = LeadTask::with('lead:id,first_name,last_name,lead_id')
            ->where('completed', false)
            ->whereNotNull('due_at')
            ->where('due_at', '<', $now)
            // Respect a snooze — a task snoozed into the future isn't nagged yet.
            ->where(fn ($q) => $q->whereNull('snoozed_until')->orWhere('snoozed_until', '<=', $now))
            ->get();

        if ($tasks->isEmpty()) {
            $this->info('No overdue tasks — nothing to send.');

            return self::SUCCESS;
        }

        // Fan each task out to every assignee (primary + additional).
        $byUser = [];
        foreach ($tasks as $task) {
            foreach ($task->allAssigneeIds() as $uid) {
                $byUser[$uid][] = $task;
            }
        }

        $users = User::whereIn('id', array_keys($byUser))
            ->whereNotNull('email')
            ->whereNotIn('role', [User::ROLE_LEAD, User::ROLE_REVOKED_LEAD])
            ->get()
            ->keyBy('id');

        $sent = 0;
        foreach ($byUser as $uid => $userTasks) {
            $user = $users->get($uid);
            if (! $user) {
                continue;
            }
            try {
                Mail::to($user->email)->queue(new OverdueTaskDigest($user, collect($userTasks)));
                $sent++;
            } catch (\Throwable $e) {
                Log::error('Overdue digest send failed', ['user_id' => $uid, 'error' => $e->getMessage()]);
            }
        }

        $this->info("Queued overdue digests for {$sent} user(s) across {$tasks->count()} overdue task(s).");

        return self::SUCCESS;
    }
}
