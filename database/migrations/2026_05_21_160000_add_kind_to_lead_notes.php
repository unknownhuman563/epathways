<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Note kinds — every internal note can now be tagged as Pre-screening or
 * Goal-setting (or General). Structured fields for those two kinds ride
 * along on the same row so we don't need a separate side table.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_notes', function (Blueprint $table) {
            $table->string('kind', 40)->default('general')->after('user_id'); // general | pre_screen | goal_setting
            $table->string('pre_screened_by', 80)->nullable()->after('kind');
            $table->string('goal_setting_status', 60)->nullable()->after('pre_screened_by');
            $table->string('goal_setting_by', 120)->nullable()->after('goal_setting_status');
            $table->index('kind');
        });
    }

    public function down(): void
    {
        Schema::table('lead_notes', function (Blueprint $table) {
            $table->dropIndex(['kind']);
            $table->dropColumn(['kind', 'pre_screened_by', 'goal_setting_status', 'goal_setting_by']);
        });
    }
};
