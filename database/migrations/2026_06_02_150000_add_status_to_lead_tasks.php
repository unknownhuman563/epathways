<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Task Board kanban state. The kanban needs three columns — Not Started /
 * In Progress / Completed — but the existing `completed` boolean only
 * encodes two states. This adds an explicit `status` column plus an
 * optional `completion_notes` capture for the "Save and complete" modal.
 *
 * `completed` is kept on the table because legacy code (LeadTaskController
 * update, sidebar badge counts, dueToday scope) reads it directly. The
 * LeadTask model has a saving hook that keeps `status` and `completed`
 * in lockstep, so both old and new write paths stay coherent.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_tasks', function (Blueprint $table) {
            $table->string('status', 20)->default('not_started')->after('completed_by');
            $table->text('completion_notes')->nullable()->after('status');

            $table->index(['status', 'department']);
        });

        // Backfill — every existing row had `completed` set; map it onto the
        // new enum so the kanban shows pre-existing tasks in the right column.
        DB::table('lead_tasks')->where('completed', true)->update(['status' => 'completed']);
        DB::table('lead_tasks')->where('completed', false)->update(['status' => 'not_started']);
    }

    public function down(): void
    {
        Schema::table('lead_tasks', function (Blueprint $table) {
            $table->dropIndex(['status', 'department']);
            $table->dropColumn(['status', 'completion_notes']);
        });
    }
};
