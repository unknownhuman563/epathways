<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Per-program "why this program" reasons for study proposals.
 *
 *   - leads.proposed_program_reasons  — reasons for the ACTIVE shortlist,
 *     keyed by program id (mirrors leads.proposed_program_ids); shown on the
 *     tracker.
 *   - lead_proposals.reasons          — snapshot of the reasons for each saved
 *     proposal version.
 *
 * The `leads` table is at InnoDB's ~8126-byte in-row limit on production MySQL,
 * so a plain `ADD COLUMN` — even a JSON column (a ~20-byte off-page pointer) —
 * fails with SQLSTATE 1118. The proven fix (see the nzer_number and
 * proposal_review migrations) is ONE atomic ALTER that ALSO frees in-row space:
 * ROW_FORMAT=DYNAMIC plus converting large, non-indexed free-text columns to
 * TEXT (BLOBs are exempt from the limit), so MySQL only evaluates the smaller
 * final table. Re-converting an already-TEXT column is a harmless no-op, so this
 * safely repeats the earlier migrations' list on any environment that ran them.
 *
 * The `lead_proposals` table is small, so its column adds the plain way.
 */
return new class extends Migration
{
    /**
     * Large, non-indexed free-text columns safe to store off-page as TEXT
     * (never used as an index; WHERE/LIKE still work). Kept in sync with the
     * proposal_review migration's list so both free the same in-row room.
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
        // leads.proposed_program_reasons — off-page-safe add on the god table.
        if (DB::getDriverName() !== 'mysql') {
            // sqlite (tests) has no row-size limit — just add the column.
            if (! Schema::hasColumn('leads', 'proposed_program_reasons')) {
                Schema::table('leads', fn (Blueprint $t) => $t->json('proposed_program_reasons')->nullable()->after('proposed_program_ids'));
            }
        } else {
            $clauses = ['ROW_FORMAT=DYNAMIC'];
            foreach ($this->toText as $col) {
                if (Schema::hasColumn('leads', $col)) {
                    $clauses[] = "MODIFY `{$col}` TEXT NULL";
                }
            }
            if (! Schema::hasColumn('leads', 'proposed_program_reasons')) {
                $clauses[] = 'ADD COLUMN `proposed_program_reasons` JSON NULL AFTER `proposed_program_ids`';
            }

            // Only run the ALTER if there is actually something to add — avoids a
            // needless table rebuild when the column already exists.
            if (count($clauses) > 1) {
                DB::statement('ALTER TABLE `leads` '.implode(', ', $clauses));
            }
        }

        // lead_proposals is a small table — the plain add is fine here.
        Schema::table('lead_proposals', function (Blueprint $table) {
            if (! Schema::hasColumn('lead_proposals', 'reasons')) {
                $table->json('reasons')->nullable()->after('program_ids');
            }
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('leads', 'proposed_program_reasons')) {
            Schema::table('leads', fn (Blueprint $t) => $t->dropColumn('proposed_program_reasons'));
        }
        if (Schema::hasColumn('lead_proposals', 'reasons')) {
            Schema::table('lead_proposals', fn (Blueprint $t) => $t->dropColumn('reasons'));
        }
    }
};
