<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * anchor_type was created as an ENUM of the original five anchor kinds
 * (case/document/gate/stage/step). New anchor kinds — "checklist" (a note on a
 * checklist requirement) and "reviewer_note" (a reply to a document's reviewer
 * note) — are rejected by that enum ("Data truncated for column anchor_type").
 * Convert it to a plain string so anchor kinds can grow without a migration.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE case_threads MODIFY anchor_type VARCHAR(20) NOT NULL");
        } else {
            // sqlite (tests) / others: rebuild the column as a string, which
            // drops the enum check constraint.
            Schema::table('case_threads', function (Blueprint $table) {
                $table->string('anchor_type', 20)->nullable(false)->change();
            });
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE case_threads MODIFY anchor_type ENUM('case','document','gate','stage','step') NOT NULL");
        } else {
            Schema::table('case_threads', function (Blueprint $table) {
                $table->enum('anchor_type', ['case', 'document', 'gate', 'stage', 'step'])->nullable(false)->change();
            });
        }
    }
};
