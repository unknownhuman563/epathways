<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the "Journey" panel fields to leads — pre-screening + goal-setting
 * captures, plus the two key dates (first contact + engagement). Surfaced
 * in the Lead Details → Journey tab.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->date('date_of_first_contact')->nullable()->after('stage');
            $table->date('date_of_engagement')->nullable()->after('date_of_first_contact');

            $table->string('prescreened_by', 120)->nullable()->after('date_of_engagement');
            $table->text('prescreened_notes')->nullable()->after('prescreened_by');

            $table->string('goal_setting_status', 60)->nullable()->after('prescreened_notes');
            $table->string('goal_setting_by', 120)->nullable()->after('goal_setting_status');
            $table->text('goal_setting_notes')->nullable()->after('goal_setting_by');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn([
                'date_of_first_contact',
                'date_of_engagement',
                'prescreened_by',
                'prescreened_notes',
                'goal_setting_status',
                'goal_setting_by',
                'goal_setting_notes',
            ]);
        });
    }
};
