<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_tasks', function (Blueprint $table) {
            // Multi-assignee support. `assignee_id` stays the primary so
            // existing scopes (dueToday, ownership checks, kanban
            // groupings) keep working unchanged; this column holds the
            // co-assignees as a JSON array of user ids.
            $table->json('additional_assignee_ids')->nullable()->after('assignee_id');
        });
    }

    public function down(): void
    {
        Schema::table('lead_tasks', function (Blueprint $table) {
            $table->dropColumn('additional_assignee_ids');
        });
    }
};
