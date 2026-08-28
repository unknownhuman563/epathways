<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * NZER number — another INZ-side identifier staff record on a case and search by.
 *
 * The `leads` table is very wide (200+ columns) and utf8mb4 (4 bytes/char), so it
 * hit InnoDB's ~8126-byte in-row limit ("Row size too large", SQLSTATE 1118) when
 * adding another VARCHAR on production. This migration frees room three ways, then
 * adds the column:
 *   1. ROW_FORMAT=DYNAMIC — stores long varchars off-page.
 *   2. Right-sizes columns that Laravel defaulted to VARCHAR(255) but only ever
 *      hold tiny values (gender, has_passport, marital_status, …). At 4 bytes/char
 *      each 255 costs up to 1020 in-row; shrinking them reclaims real space and
 *      works under any row format. Each MODIFY is isolated so a column whose data
 *      is somehow longer than the new size is skipped, never truncated.
 *   3. Adds nzer_number (idempotent — safe to re-run after a prior partial failure).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            try {
                DB::statement('ALTER TABLE `leads` ROW_FORMAT=DYNAMIC');
            } catch (\Throwable $e) {
                // already dynamic / unsupported — the shrinks below still free space
            }

            $modify = [
                "`gender` VARCHAR(40) NULL",
                "`marital_status` VARCHAR(40) NULL",
                "`has_passport` VARCHAR(20) NULL",
                "`ai_analysis_status` VARCHAR(30) NOT NULL DEFAULT 'pending'",
                "`branch` VARCHAR(80) NULL",
                "`stage` VARCHAR(120) NULL",
                "`status` VARCHAR(80) NOT NULL DEFAULT 'New'",
                "`english_assignee` VARCHAR(60) NULL",
                "`immigration_assignee` VARCHAR(60) NULL",
                "`student_payment` VARCHAR(60) NULL",
                "`student_coop` VARCHAR(60) NULL",
                "`student_oop` VARCHAR(60) NULL",
                "`referral` VARCHAR(191) NULL",
                "`country` VARCHAR(120) NULL",
            ];
            foreach ($modify as $def) {
                try {
                    DB::statement("ALTER TABLE `leads` MODIFY {$def}");
                } catch (\Throwable $e) {
                    // data longer than the new size — skip this one, keep going
                }
            }
        }

        if (! Schema::hasColumn('leads', 'nzer_number')) {
            Schema::table('leads', function (Blueprint $table) {
                $table->string('nzer_number', 60)->nullable()->after('inz_medical_ref');
            });
        }
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
