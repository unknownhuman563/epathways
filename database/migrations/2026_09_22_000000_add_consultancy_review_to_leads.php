<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Consultancy Agreement Verification state — a SINGLE JSON column on `leads`.
 *
 * The `leads` table sits at InnoDB's ~8126-byte in-row limit and its row format
 * keeps a 768-byte inline prefix even for JSON/BLOB columns, so a second JSON
 * column tips it over ("1118 Row size too large"). Everything therefore lives
 * in one `consultancy_review` blob: the workflow envelope PLUS the per fee-item
 * meta under `items` (amount / status / note thread). See CLAUDE.md.
 *
 * Idempotent: an earlier version of this migration added a second
 * `consultancy_meta` column on some environments — drop it if present, and only
 * add `consultancy_review` when it isn't already there (a partial prior run may
 * have created it before failing).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            if (! Schema::hasColumn('leads', 'consultancy_review')) {
                $table->json('consultancy_review')->nullable()->after('proposal_review');
            }
            if (Schema::hasColumn('leads', 'consultancy_meta')) {
                $table->dropColumn('consultancy_meta');
            }
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            foreach (['consultancy_review', 'consultancy_meta'] as $col) {
                if (Schema::hasColumn('leads', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
