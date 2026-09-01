<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Study-proposal verification workflow — a JSON column on `leads`.
 *
 * The `leads` table is at InnoDB's ~8126-byte in-row limit on production MySQL,
 * so even adding a JSON column (a 20-byte off-page pointer) fails with SQLSTATE
 * 1118 once the table is at the edge. The proven fix (see the nzer_number
 * migration) is ONE atomic ALTER that ALSO frees in-row space — ROW_FORMAT=
 * DYNAMIC plus converting more large, non-indexed free-text columns to TEXT
 * (BLOBs are exempt from the limit) — so MySQL only evaluates the smaller final
 * table. Converting an already-TEXT column is a harmless no-op.
 */
return new class extends Migration
{
    /**
     * Additional large, non-indexed free-text columns safe to store off-page as
     * TEXT (never used as an index; WHERE/LIKE still work on TEXT). Beyond the
     * set the nzer_number migration already converted, to free fresh in-row room.
     */
    private array $toText = [
        // nzer_number set converted these — repeating is a no-op on prod, real on
        // any environment that skipped it.
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
        // Newly converted here to free additional room.
        'student_oop', 'student_payment', 'student_coop', 'student_visa',
        'last_activity_desc', 'country_of_birth', 'citizenship',
        'country', 'residence_country', 'branch', 'middle_name',
        'goal_setting_status', 'inz_visa_type',
    ];

    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            // sqlite (tests) has no row-size limit — just add the column.
            if (! Schema::hasColumn('leads', 'proposal_review')) {
                Schema::table('leads', fn (Blueprint $t) => $t->json('proposal_review')->nullable());
            }

            return;
        }

        $clauses = ['ROW_FORMAT=DYNAMIC'];
        foreach ($this->toText as $col) {
            if (Schema::hasColumn('leads', $col)) {
                $clauses[] = "MODIFY `{$col}` TEXT NULL";
            }
        }
        if (! Schema::hasColumn('leads', 'proposal_review')) {
            $clauses[] = 'ADD COLUMN `proposal_review` JSON NULL';
        }

        // One atomic ALTER — MySQL evaluates only the resulting (smaller) table.
        DB::statement('ALTER TABLE `leads` '.implode(', ', $clauses));
    }

    public function down(): void
    {
        if (Schema::hasColumn('leads', 'proposal_review')) {
            Schema::table('leads', fn (Blueprint $t) => $t->dropColumn('proposal_review'));
        }
    }
};
