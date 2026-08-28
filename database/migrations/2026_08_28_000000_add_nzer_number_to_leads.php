<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * NZER number — another INZ-side identifier staff record on a case and search by.
 *
 * The `leads` table's EXISTING columns already exceed InnoDB's ~8126-byte in-row
 * limit on production MySQL, so adding any column — even a nullable TEXT one —
 * fails (SQLSTATE 1118), and shrinking columns one at a time also fails because
 * each individual ALTER still leaves the table over the limit.
 *
 * The fix must be ONE atomic ALTER so MySQL only evaluates the FINAL table:
 *   - ROW_FORMAT=DYNAMIC (stores long varchars off-page), plus
 *   - convert a batch of large, non-searched columns to TEXT (BLOB types are
 *     exempt from the 8126 limit), plus
 *   - add nzer_number as TEXT
 * all in a single statement, whose resulting table fits comfortably.
 */
return new class extends Migration
{
    /** Large, free-text / link / misc columns that are safe to store off-page as
     *  TEXT (never searched or indexed) — moving them off the in-row budget. */
    private array $toText = [
        'other_names', 'preferred_name', 'place_of_birth',
        'residence_city', 'residence_state',
        'residence_address_line_1', 'residence_address_line_2',
        'passport_path', 'passport_issuing_country',
        'current_nz_visa_type', 'previous_nz_visa_type',
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
        'client_info_link', 'call_update_form_link',
        'prescreened_by', 'goal_setting_by',
        'student_school', 'student_gdrive_link', 'gdrive_folder_id',
        'preferred_course', 'preferred_qualification_level',
        'preferred_city_of_study', 'preferred_intake', 'target_institution',
        'current_employer_name', 'current_position_title',
        'current_employer_country', 'current_employer_email',
        'nz_professional_registration_body',
        'highest_qualification', 'highest_qualification_field',
        'highest_qualification_country', 'nzqa_assessment_level',
    ];

    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            // sqlite (tests) has no row-size limit — just add the column.
            if (! Schema::hasColumn('leads', 'nzer_number')) {
                Schema::table('leads', fn (Blueprint $t) => $t->text('nzer_number')->nullable());
            }

            return;
        }

        $clauses = ['ROW_FORMAT=DYNAMIC'];
        foreach ($this->toText as $col) {
            if (Schema::hasColumn('leads', $col)) {
                $clauses[] = "MODIFY `{$col}` TEXT NULL";
            }
        }
        if (! Schema::hasColumn('leads', 'nzer_number')) {
            $clauses[] = "ADD COLUMN `nzer_number` TEXT NULL";
        }

        // One atomic ALTER — MySQL evaluates only the resulting (much smaller) table.
        DB::statement('ALTER TABLE `leads` '.implode(', ', $clauses));
    }

    public function down(): void
    {
        if (Schema::hasColumn('leads', 'nzer_number')) {
            Schema::table('leads', fn (Blueprint $t) => $t->dropColumn('nzer_number'));
        }
    }
};
