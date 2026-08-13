<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Two new setup axes on a staffer's DTR:
 *  - employment_type: full_time | part_time (a designation; part-timers just
 *    carry a lower std_hours).
 *  - schedule_type: fixed | flexi. Fixed follows sched_in/out (lateness applies).
 *    Flexi has no fixed clock-in — the staffer works any hours toward their
 *    std_hours target and is never marked Late.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dtr_settings', function (Blueprint $table) {
            $table->string('employment_type', 20)->default('full_time')->after('position');
            $table->string('schedule_type', 12)->default('fixed')->after('sched_out');
        });
    }

    public function down(): void
    {
        Schema::table('dtr_settings', function (Blueprint $table) {
            $table->dropColumn(['employment_type', 'schedule_type']);
        });
    }
};
