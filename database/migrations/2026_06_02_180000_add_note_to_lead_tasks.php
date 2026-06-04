<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A short freeform note rendered prominently on the kanban card — distinct
 * from `description` (longer body text) and `comments` (threaded). Think
 * of it as a sticky annotation: "Has to finish this before weekend",
 * "We have a meeting 2:34 AM", etc.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_tasks', function (Blueprint $table) {
            $table->text('note')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('lead_tasks', function (Blueprint $table) {
            $table->dropColumn('note');
        });
    }
};
