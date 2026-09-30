<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * INZ-style sub-status tracker for immigration cases in the Visa Lodge /
 * Visa Outcome stages.
 *
 * Stored as a single nullable JSON column. JSON (like TEXT/BLOB) is exempt from
 * InnoDB's ~8126-byte in-row limit, so — unlike a VARCHAR — it can be added to
 * the already-at-limit `leads` god table without a "Row size too large" (1118)
 * failure on production MySQL. No existing column or row is altered; existing
 * cases simply have NULL until staff set a status.
 *
 * The lodge / outcome datetimes reuse the existing inz_lodged_at /
 * inz_decision_at columns; this column only holds the activities + their
 * per-activity status history + the overall application_status label.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->json('visa_progress')->nullable()->after('stage_history');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('visa_progress');
        });
    }
};
