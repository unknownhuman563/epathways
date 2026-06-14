<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add the four columns the visa checklist's "non-document" items need so
 * the seeder can drop them from the checklist. Every checklist item must
 * be a physical upload — anything that's just data lives on the lead row.
 *
 *   current_employer_phone / _email
 *     AEWV needs employer contact channels on file. We already capture
 *     name/country/start date but not phone or email.
 *
 *   meets_184_day_rule_two_years
 *     PRV-specific: applicants must have spent at least 184 days in NZ in
 *     each of the last two years. has_been_in_nz_continuously captures
 *     the broader "general residence" idea — this column captures the
 *     sharper PRV rule explicitly.
 *
 *   dependent_children_notes
 *     Free-text placeholder for per-child details (full name, DOB,
 *     gender, country of birth, citizenship + residence, passport). A
 *     structured `applicant_children` multi-row table is Phase 2 work;
 *     until then staff captures everything in a single text blob.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            if (! Schema::hasColumn('leads', 'current_employer_phone')) {
                $table->string('current_employer_phone', 50)->nullable()->after('current_employer_country');
            }
            if (! Schema::hasColumn('leads', 'current_employer_email')) {
                $table->string('current_employer_email', 200)->nullable()->after('current_employer_phone');
            }
            if (! Schema::hasColumn('leads', 'meets_184_day_rule_two_years')) {
                $table->boolean('meets_184_day_rule_two_years')->nullable()->after('has_been_in_nz_continuously');
            }
            if (! Schema::hasColumn('leads', 'dependent_children_notes')) {
                $table->text('dependent_children_notes')->nullable()->after('number_of_children');
            }
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            foreach ([
                'current_employer_phone',
                'current_employer_email',
                'meets_184_day_rule_two_years',
                'dependent_children_notes',
            ] as $column) {
                if (Schema::hasColumn('leads', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
