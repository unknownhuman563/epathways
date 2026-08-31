<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Snoozing a follow-up parks it: it drops out of the sub-agent portal's
 * overdue/today/this-week buckets until `snoozed_until` passes, instead of
 * sitting in Overdue nagging. Distinct from rescheduling, which moves `due_at`
 * — the due date is still the commitment, the snooze only hides the reminder.
 *
 * `lead_tasks` is a normal-width table, so a plain nullable timestamp is safe
 * here (unlike `leads`, see CLAUDE.md).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_tasks', function (Blueprint $table) {
            $table->timestamp('snoozed_until')->nullable()->after('due_at');
            // Every follow-up bucket filters on this alongside `completed`.
            $table->index(['completed', 'snoozed_until'], 'lead_tasks_completed_snoozed_idx');
        });
    }

    public function down(): void
    {
        Schema::table('lead_tasks', function (Blueprint $table) {
            $table->dropIndex('lead_tasks_completed_snoozed_idx');
            $table->dropColumn('snoozed_until');
        });
    }
};
