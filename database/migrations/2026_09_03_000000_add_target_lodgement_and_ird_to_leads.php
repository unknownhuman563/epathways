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
 * limit (see CLAUDE.md). `date` is 3 in-row bytes and `ird_number` is TEXT
 * (BLOB-family, only a ~20-byte pointer in-row), but asserting ROW_FORMAT=DYNAMIC
 * alone is NOT enough on this table — it still trips SQLSTATE 1118. The proven
 * fix (see the nzer_number and proposal_review migrations) is ONE atomic ALTER
 * that ALSO frees in-row space by converting large, non-indexed free-text columns
 * to TEXT, so MySQL only evaluates the smaller final table. Re-converting an
 * already-TEXT column is a harmless no-op.
 */
return new class extends Migration
{
    /**
     * Large, non-indexed free-text columns safe to store off-page as TEXT (never
     * used as an index; WHERE/LIKE still work). Kept in sync with the nzer_number
     * and proposal_review migrations' list so all three free the same in-row room.
     */
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
        'student_oop', 'student_payment', 'student_coop', 'student_visa',
        'last_activity_desc', 'country_of_birth', 'citizenship',
        'country', 'residence_country', 'branch', 'middle_name',
        'goal_setting_status', 'inz_visa_type',
    ];

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
        foreach ($this->toText as $col) {
            if (Schema::hasColumn('leads', $col)) {
                $clauses[] = "MODIFY `{$col}` TEXT NULL";
            }
        }
        if (! Schema::hasColumn('leads', 'target_lodgement_at')) {
            $clauses[] = 'ADD COLUMN `target_lodgement_at` DATE NULL';
        }
        if (! Schema::hasColumn('leads', 'ird_number')) {
            $clauses[] = 'ADD COLUMN `ird_number` TEXT NULL';
        }

        // Only rebuild if there's an actual add — a pure MODIFY-list would just
        // re-convert already-TEXT columns for no gain.
        if (Schema::hasColumn('leads', 'target_lodgement_at') && Schema::hasColumn('leads', 'ird_number')) {
            return;
        }
        DB::statement('ALTER TABLE `leads` '.implode(', ', $clauses));
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
