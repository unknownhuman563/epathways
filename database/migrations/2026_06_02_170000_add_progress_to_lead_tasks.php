<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Optional 0–100% completion indicator on a task. Rendered as a small
 * progress bar on the kanban card when > 0. Defaults to 0 so existing
 * rows just stay quiet (no bar shown).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_tasks', function (Blueprint $table) {
            $table->unsignedTinyInteger('progress')->default(0)->after('priority');
        });
    }

    public function down(): void
    {
        Schema::table('lead_tasks', function (Blueprint $table) {
            $table->dropColumn('progress');
        });
    }
};
