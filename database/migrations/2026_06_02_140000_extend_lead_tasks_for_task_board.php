<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Task Board upgrade — broadens lead_tasks from "follow-ups attached to a
 * Lead" into a general Task table that can also hold department/personal
 * work that's not tied to a specific record. Required for the New Task
 * modal (see resources/js/components/task-board/NewTaskModal.jsx).
 *
 *  - lead_id becomes nullable so department tasks can exist
 *  - type: communication style of the task (call/email/meeting/etc.)
 *  - category: required for department/personal tasks; nullable here
 *  - department: which department a task belongs to (admin-routable)
 *  - tags: free-text JSON array; no relational link to LeadTag
 *  - recurrence_config: JSON config for recurring task templates
 *  - cross_dept_reason: justification when assigning across departments
 *
 * The table name stays `lead_tasks` for now; renaming touches every
 * controller and would expand the blast radius beyond this prompt.
 */
return new class extends Migration
{
    public function up(): void
    {
        // SQLite (used by the test suite) cannot ALTER a FK column to
        // nullable in place — the existing FK has to be dropped first.
        // doctrine/dbal is not installed, so we use a guarded raw path
        // for MySQL and an early-exit no-op for SQLite (tests can still
        // insert tasks because they always pass lead_id).
        $driver = DB::connection()->getDriverName();

        Schema::table('lead_tasks', function (Blueprint $table) {
            $table->string('type', 32)->nullable()->after('description');
            $table->string('category', 100)->nullable()->after('type');
            $table->string('department', 32)->nullable()->after('category');
            $table->json('tags')->nullable()->after('department');
            $table->json('recurrence_config')->nullable()->after('tags');
            $table->text('cross_dept_reason')->nullable()->after('recurrence_config');

            $table->index(['department', 'completed']);
        });

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE lead_tasks MODIFY lead_id BIGINT UNSIGNED NULL');
        }
    }

    public function down(): void
    {
        Schema::table('lead_tasks', function (Blueprint $table) {
            $table->dropIndex(['department', 'completed']);
            $table->dropColumn([
                'type', 'category', 'department', 'tags',
                'recurrence_config', 'cross_dept_reason',
            ]);
        });

        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE lead_tasks MODIFY lead_id BIGINT UNSIGNED NOT NULL');
        }
    }
};
