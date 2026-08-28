<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * NZER number — another INZ-side identifier staff record on a case and search by.
 *
 * The `leads` table is very wide (200+ columns) and utf8mb4, so adding another
 * VARCHAR overflowed InnoDB's ~8126-byte in-row limit on production
 * ("Row size too large", SQLSTATE 1118). The error's own hint is the fix:
 *   "The maximum row size … NOT COUNTING BLOBs, is 8126 … change some columns
 *    to TEXT or BLOBs."
 * TEXT is a BLOB type stored off-page, so it does not count toward that limit and
 * adds cleanly no matter the MySQL version or row format. nzer_number only ever
 * holds a short id; TEXT is searched with LIKE exactly like a VARCHAR would be.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('leads', 'nzer_number')) {
            // A prior run (or local dev) may have created it as VARCHAR — normalise
            // to TEXT so every environment matches and it's off the in-row budget.
            if (DB::getDriverName() === 'mysql') {
                try {
                    DB::statement('ALTER TABLE `leads` MODIFY `nzer_number` TEXT NULL');
                } catch (\Throwable $e) {
                    // leave it as-is if it can't be modified
                }
            }

            return;
        }

        Schema::table('leads', function (Blueprint $table) {
            $table->text('nzer_number')->nullable();
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('leads', 'nzer_number')) {
            Schema::table('leads', function (Blueprint $table) {
                $table->dropColumn('nzer_number');
            });
        }
    }
};
