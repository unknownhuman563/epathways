<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-day-of-week schedule for a DTR. NULL keeps the legacy single schedule
 * (sched_in/sched_out apply to every day). When set, it's a map keyed by
 * mon..sun: {"on": bool, "in": "HH:MM"|null, "out": "HH:MM"|null}. A day with
 * on=false (or absent) is a day off — no lateness, not a scheduled work day.
 * This lets weekends carry a different time schedule from weekdays.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dtr_settings', function (Blueprint $table) {
            $table->json('weekly_schedule')->nullable()->after('sched_out');
        });
    }

    public function down(): void
    {
        Schema::table('dtr_settings', function (Blueprint $table) {
            $table->dropColumn('weekly_schedule');
        });
    }
};
