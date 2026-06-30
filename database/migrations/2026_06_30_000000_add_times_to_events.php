<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Event-level start/end times — used when the event has no `event_sessions`
 * rows. Sessions still own their own time columns; these are the fallback
 * surfaced on the public registration page when there are no sessions.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            if (! Schema::hasColumn('events', 'time_start')) {
                $table->time('time_start')->nullable()->after('date_to');
            }
            if (! Schema::hasColumn('events', 'time_end')) {
                $table->time('time_end')->nullable()->after('time_start');
            }
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            foreach (['time_start', 'time_end'] as $col) {
                if (Schema::hasColumn('events', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
