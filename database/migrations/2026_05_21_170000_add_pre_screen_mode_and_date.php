<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pre-screening notes pick up two more captures: the mode of contact
 * (Google Meet vs phone call) and the date the pre-screen happened.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_notes', function (Blueprint $table) {
            $table->string('pre_screen_mode', 30)->nullable()->after('pre_screened_by'); // gmeet | call
            $table->date('pre_screen_date')->nullable()->after('pre_screen_mode');
        });
    }

    public function down(): void
    {
        Schema::table('lead_notes', function (Blueprint $table) {
            $table->dropColumn(['pre_screen_mode', 'pre_screen_date']);
        });
    }
};
