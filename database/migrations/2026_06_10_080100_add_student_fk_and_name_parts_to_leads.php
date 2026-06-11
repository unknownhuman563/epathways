<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add the schools FK plus the missing legal-name parts (middle_name,
 * suffix) that the Education team's add-student form collects. The
 * legacy free-form `student_school` string column stays in place so
 * existing rows keep working — new rows prefer school_id.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            // Guard against columns that an earlier migration may already
            // have created — `middle_name` was added by the lead-tracking
            // feature on 2026-06-09. Re-adding it here would fail with
            // SQLSTATE[42S21] / duplicate-column on a freshly-merged
            // checkout. Suffix + school_id are net-new.
            if (! Schema::hasColumn('leads', 'middle_name')) {
                $table->string('middle_name')->nullable()->after('first_name');
            }
            if (! Schema::hasColumn('leads', 'suffix')) {
                $table->string('suffix', 20)->nullable()->after('last_name');
            }
            if (! Schema::hasColumn('leads', 'school_id')) {
                $table->foreignId('school_id')->nullable()
                    ->after('student_school')
                    ->constrained('schools')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropForeign(['school_id']);
            $table->dropColumn(['middle_name', 'suffix', 'school_id']);
        });
    }
};
