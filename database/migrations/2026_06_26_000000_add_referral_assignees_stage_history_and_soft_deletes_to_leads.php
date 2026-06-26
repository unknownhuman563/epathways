<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Staff-feedback batch on the Leads / Students records:
 *  • `referral`             — who referred this lead, shown beside the contact number.
 *  • `english_assignee`     — named person handling the current English stage
 *                             (e.g. PTE Review → Paula / Frank / DIY). Free text label.
 *  • `immigration_assignee` — named person handling the current Immigration stage
 *                             (e.g. Endorsed → Hendry / Tarun / Dev). Free text label.
 *  • `stage_history`        — full dated timeline of every department status change
 *                             ([{department, stage, at, by_id, by_name}, …]) so the
 *                             Pipeline can show "when" each status was reached.
 *  • soft deletes           — a Delete button on Leads / Students archives the row
 *                             (recoverable) instead of destroying notes / docs / history.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            if (! Schema::hasColumn('leads', 'referral')) {
                $table->string('referral')->nullable()->after('phone');
            }
            if (! Schema::hasColumn('leads', 'english_assignee')) {
                $table->string('english_assignee')->nullable()->after('english_stage');
            }
            if (! Schema::hasColumn('leads', 'immigration_assignee')) {
                $table->string('immigration_assignee')->nullable()->after('immigration_stage');
            }
            if (! Schema::hasColumn('leads', 'stage_history')) {
                $table->json('stage_history')->nullable()->after('stage_updated_by');
            }
            if (! Schema::hasColumn('leads', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            foreach (['referral', 'english_assignee', 'immigration_assignee', 'stage_history'] as $col) {
                if (Schema::hasColumn('leads', $col)) {
                    $table->dropColumn($col);
                }
            }
            if (Schema::hasColumn('leads', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });
    }
};
