<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds a JSON column to leads for the Documents-tab checklist. The
 * checklist structure (sections + items + filename patterns) lives in
 * the frontend; this column just stores per-item state keyed by the
 * frontend item id.
 *
 *   {
 *     "agreement.consultancy": {
 *       "status": "uploaded",
 *       "date":   "2026-05-20",
 *       "notes":  "Signed by client"
 *     },
 *     ...
 *   }
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->json('document_checklist')->nullable()->after('goal_setting_notes');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('document_checklist');
        });
    }
};
