<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Two case fields on `leads`:
 *   - `target_lodgement_at` (date): the planned INZ filing date — drives the
 *     Overview "Target lodgement" fact and the header "Next deadlines".
 *   - `ird_number` (text): the applicant's IRD number, shown on the Personal tab.
 *
 * The `leads` table is the 200+ column god table at InnoDB's ~8126-byte in-row
 * limit (see CLAUDE.md). A `date` is a fixed 3 bytes; `ird_number` is TEXT
 * (BLOB-family, exempt from the limit — only a ~20-byte pointer sits in-row).
 * Both are added in ONE atomic ALTER that also asserts ROW_FORMAT=DYNAMIC, so
 * MySQL evaluates the final schema once and never trips SQLSTATE 1118.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            Schema::table('leads', function (Blueprint $t) {
                if (! Schema::hasColumn('leads', 'target_lodgement_at')) {
                    $t->date('target_lodgement_at')->nullable();
                }
                if (! Schema::hasColumn('leads', 'ird_number')) {
                    $t->text('ird_number')->nullable();
                }
            });

            return;
        }

        $clauses = ['ROW_FORMAT=DYNAMIC'];
        if (! Schema::hasColumn('leads', 'target_lodgement_at')) {
            $clauses[] = 'ADD COLUMN `target_lodgement_at` DATE NULL';
        }
        if (! Schema::hasColumn('leads', 'ird_number')) {
            $clauses[] = 'ADD COLUMN `ird_number` TEXT NULL';
        }
        if (count($clauses) > 1) {
            DB::statement('ALTER TABLE `leads` '.implode(', ', $clauses));
        }
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $t) {
            foreach (['target_lodgement_at', 'ird_number'] as $col) {
                if (Schema::hasColumn('leads', $col)) {
                    $t->dropColumn($col);
                }
            }
        });
    }
};
