<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-section verification state for the Documents-tab checklist. Keyed
 * by the frontend's section key (e.g. "agreements", "personal").
 *
 *   {
 *     "agreements": {
 *       "status":         "verified",   // pending | in_review | verified | revisions_needed
 *       "verified_at":    "2026-05-21T10:30:00Z",
 *       "verified_by":    "Emma Ceba",
 *       "verified_by_id": 7,
 *       "notes":          "All good"
 *     },
 *     ...
 *   }
 *
 * The lead-portal flow unlocks sections sequentially: section N is editable
 * once section N-1 reaches "verified". This column is the source of truth.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->json('section_verifications')->nullable()->after('document_checklist');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('section_verifications');
        });
    }
};
