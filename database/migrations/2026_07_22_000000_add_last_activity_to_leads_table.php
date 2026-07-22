<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Last activity" tracking for the Updated column on the portal case /
 * lead tables.
 *
 * `updated_at` alone is misleading there: it also moves for background jobs
 * (AI analysis), client-side actions and system touches, and it says nothing
 * about *who* did it — the column previously borrowed the stage-mover's name,
 * which pairs an unrelated person with an edit they never made.
 *
 * These columns are written only when an authenticated staff member changes
 * something meaningful on the lead.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->timestamp('last_activity_at')->nullable()->after('stage_updated_by');
            $table->foreignId('last_activity_by')->nullable()->after('last_activity_at')
                ->constrained('users')->nullOnDelete();
            // Short human summary of the change, e.g. "Stage → Endorsed" or
            // "Updated email, phone". Shown under the timestamp.
            $table->string('last_activity_desc', 160)->nullable()->after('last_activity_by');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropConstrainedForeignId('last_activity_by');
            $table->dropColumn(['last_activity_at', 'last_activity_desc']);
        });
    }
};
