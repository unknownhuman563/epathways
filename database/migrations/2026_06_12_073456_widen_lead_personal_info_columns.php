<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Wide profile-information build: adds the missing columns so the
 * Personal Info tab on the lead detail page can be fully editable across
 * all 9 section cards (Identity, Study Plans, Financial, Education,
 * Employment, Family, Passport, Current NZ Visa, Health & Character).
 *
 * Existing columns are intentionally untouched — `dob`, `passport_expiry`,
 * `marital_status`, `gender`, etc. already exist and keep their names.
 * Every NEW column is added with a `Schema::hasColumn` guard so the
 * migration is idempotent against partial-state databases.
 *
 * Passport number encryption: existing plain values are re-written
 * via Crypt::encryptString in this migration so the model's `encrypted`
 * cast can take over cleanly after deploy. New writes (and the new
 * `current_nz_visa_number` column, which has no legacy data) use the
 * cast directly.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            // ── Personal identity ──────────────────────────────────────
            if (! Schema::hasColumn('leads', 'preferred_name')) {
                $table->string('preferred_name', 100)->nullable()->after('other_names');
            }
            if (! Schema::hasColumn('leads', 'whatsapp')) {
                $table->string('whatsapp', 40)->nullable()->after('phone');
            }
            if (! Schema::hasColumn('leads', 'residence_address_line_1')) {
                $table->string('residence_address_line_1', 200)->nullable()->after('residence_country');
            }
            if (! Schema::hasColumn('leads', 'residence_address_line_2')) {
                $table->string('residence_address_line_2', 200)->nullable()->after('residence_address_line_1');
            }
            if (! Schema::hasColumn('leads', 'residence_address_postcode')) {
                $table->string('residence_address_postcode', 20)->nullable()->after('residence_address_line_2');
            }
            if (! Schema::hasColumn('leads', 'has_been_in_nz_continuously')) {
                $table->boolean('has_been_in_nz_continuously')->nullable()->after('residence_address_postcode');
            }
            if (! Schema::hasColumn('leads', 'nz_continuous_residence_months')) {
                $table->unsignedInteger('nz_continuous_residence_months')->nullable()->after('has_been_in_nz_continuously');
            }

            // ── Passport (existing has_passport / passport_number /
            //              passport_expiry / passport_path stay) ─────────
            if (! Schema::hasColumn('leads', 'passport_issuing_country')) {
                $table->string('passport_issuing_country', 120)->nullable()->after('passport_number');
            }
            if (! Schema::hasColumn('leads', 'passport_issue_date')) {
                $table->date('passport_issue_date')->nullable()->after('passport_issuing_country');
            }

            // ── Current NZ visa ────────────────────────────────────────
            if (! Schema::hasColumn('leads', 'current_nz_visa_type')) {
                $table->string('current_nz_visa_type', 120)->nullable()->after('passport_path');
            }
            if (! Schema::hasColumn('leads', 'current_nz_visa_number')) {
                // Encrypted at rest — text column to fit Crypt::encryptString
                // output, which is base64 of an IV + ciphertext + MAC.
                $table->text('current_nz_visa_number')->nullable()->after('current_nz_visa_type');
            }
            if (! Schema::hasColumn('leads', 'current_nz_visa_issued_date')) {
                $table->date('current_nz_visa_issued_date')->nullable()->after('current_nz_visa_number');
            }
            if (! Schema::hasColumn('leads', 'current_nz_visa_expiry_date')) {
                $table->date('current_nz_visa_expiry_date')->nullable()->after('current_nz_visa_issued_date');
            }
            if (! Schema::hasColumn('leads', 'previous_nz_visa_type')) {
                $table->string('previous_nz_visa_type', 120)->nullable()->after('current_nz_visa_expiry_date');
            }
        });

        // Encrypted-passport backfill must run AFTER passport columns
        // exist on the table; bundled in the same up() so a single
        // migrate command leaves the system in a consistent state.
        $this->encryptExistingPassportNumbers();

        Schema::table('leads', function (Blueprint $table) {
            // ── Study plans (flat columns alongside the legacy related
            //                 `lead_study_plans` table — the latter stays
            //                 untouched so historical data isn't lost) ──
            $this->add($table, 'preferred_course',              fn ($t, $c) => $t->string($c, 200)->nullable());
            $this->add($table, 'preferred_qualification_level', fn ($t, $c) => $t->string($c, 120)->nullable());
            $this->add($table, 'preferred_city_of_study',       fn ($t, $c) => $t->string($c, 120)->nullable());
            $this->add($table, 'preferred_intake',              fn ($t, $c) => $t->string($c, 120)->nullable());
            $this->add($table, 'english_test_type',             fn ($t, $c) => $t->string($c, 30)->nullable());
            $this->add($table, 'english_test_overall_score',    fn ($t, $c) => $t->decimal($c, 5, 2)->nullable());
            $this->add($table, 'english_test_listening',        fn ($t, $c) => $t->decimal($c, 5, 2)->nullable());
            $this->add($table, 'english_test_reading',          fn ($t, $c) => $t->decimal($c, 5, 2)->nullable());
            $this->add($table, 'english_test_writing',          fn ($t, $c) => $t->decimal($c, 5, 2)->nullable());
            $this->add($table, 'english_test_speaking',         fn ($t, $c) => $t->decimal($c, 5, 2)->nullable());
            $this->add($table, 'english_test_date',             fn ($t, $c) => $t->date($c)->nullable());
            $this->add($table, 'target_institution',            fn ($t, $c) => $t->string($c, 200)->nullable());

            // ── Financial ──────────────────────────────────────────────
            $this->add($table, 'funding_source',                  fn ($t, $c) => $t->string($c, 30)->nullable());
            $this->add($table, 'estimated_total_cost_nzd',        fn ($t, $c) => $t->decimal($c, 12, 2)->nullable());
            $this->add($table, 'available_funds_nzd',             fn ($t, $c) => $t->decimal($c, 12, 2)->nullable());
            $this->add($table, 'supports_partner_or_dependents',  fn ($t, $c) => $t->boolean($c)->nullable());
            $this->add($table, 'has_property_in_home_country',    fn ($t, $c) => $t->boolean($c)->nullable());
            $this->add($table, 'annual_income_nzd',               fn ($t, $c) => $t->decimal($c, 12, 2)->nullable());
            $this->add($table, 'annual_income_currency',          fn ($t, $c) => $t->string($c, 3)->nullable()->default('NZD'));
            $this->add($table, 'bank_funds_evidence_provided',    fn ($t, $c) => $t->boolean($c)->nullable());

            // ── Employment ─────────────────────────────────────────────
            $this->add($table, 'employment_type',                  fn ($t, $c) => $t->string($c, 30)->nullable());
            $this->add($table, 'current_employer_name',            fn ($t, $c) => $t->string($c, 200)->nullable());
            $this->add($table, 'current_position_title',           fn ($t, $c) => $t->string($c, 200)->nullable());
            $this->add($table, 'current_employer_country',         fn ($t, $c) => $t->string($c, 120)->nullable());
            $this->add($table, 'current_employment_start_date',    fn ($t, $c) => $t->date($c)->nullable());
            $this->add($table, 'current_salary_nzd',               fn ($t, $c) => $t->decimal($c, 12, 2)->nullable());
            $this->add($table, 'years_of_relevant_experience',     fn ($t, $c) => $t->unsignedInteger($c)->nullable());
            $this->add($table, 'has_anzsco_listed_role',           fn ($t, $c) => $t->boolean($c)->nullable());
            $this->add($table, 'anzsco_code',                      fn ($t, $c) => $t->string($c, 10)->nullable());
            $this->add($table, 'has_nz_professional_registration', fn ($t, $c) => $t->boolean($c)->nullable());
            $this->add($table, 'nz_professional_registration_body',fn ($t, $c) => $t->string($c, 200)->nullable());

            // ── Education background ───────────────────────────────────
            $this->add($table, 'highest_qualification',              fn ($t, $c) => $t->string($c, 60)->nullable());
            $this->add($table, 'highest_qualification_field',        fn ($t, $c) => $t->string($c, 200)->nullable());
            $this->add($table, 'highest_qualification_country',      fn ($t, $c) => $t->string($c, 120)->nullable());
            $this->add($table, 'highest_qualification_year_completed', fn ($t, $c) => $t->unsignedSmallInteger($c)->nullable());
            $this->add($table, 'has_nzqa_assessment',                fn ($t, $c) => $t->boolean($c)->nullable());
            $this->add($table, 'nzqa_assessment_level',              fn ($t, $c) => $t->string($c, 120)->nullable());

            // ── Family ─────────────────────────────────────────────────
            $this->add($table, 'has_children',            fn ($t, $c) => $t->boolean($c)->nullable());
            $this->add($table, 'number_of_children',      fn ($t, $c) => $t->unsignedSmallInteger($c)->nullable());
            $this->add($table, 'has_dependent_partner',   fn ($t, $c) => $t->boolean($c)->nullable());
            $this->add($table, 'partner_in_nz',           fn ($t, $c) => $t->boolean($c)->nullable());
            $this->add($table, 'intends_to_bring_family', fn ($t, $c) => $t->boolean($c)->nullable());

            // ── Health & character ─────────────────────────────────────
            // Disclosure flags default false so a brand-new lead has a
            // clean baseline rather than tri-state NULL.
            $this->add($table, 'has_health_disclosure',     fn ($t, $c) => $t->boolean($c)->default(false));
            $this->add($table, 'health_disclosure_notes',   fn ($t, $c) => $t->text($c)->nullable());
            $this->add($table, 'has_character_disclosure',  fn ($t, $c) => $t->boolean($c)->default(false));
            $this->add($table, 'character_disclosure_notes', fn ($t, $c) => $t->text($c)->nullable());
            $this->add($table, 'has_been_declined_visa',    fn ($t, $c) => $t->boolean($c)->default(false));
            $this->add($table, 'declined_visa_details',     fn ($t, $c) => $t->text($c)->nullable());
            $this->add($table, 'has_criminal_record',       fn ($t, $c) => $t->boolean($c)->default(false));
            $this->add($table, 'criminal_record_details',   fn ($t, $c) => $t->text($c)->nullable());
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $drops = [
                'preferred_name', 'whatsapp', 'residence_address_line_1', 'residence_address_line_2',
                'residence_address_postcode', 'has_been_in_nz_continuously', 'nz_continuous_residence_months',
                'passport_issuing_country', 'passport_issue_date',
                'current_nz_visa_type', 'current_nz_visa_number', 'current_nz_visa_issued_date',
                'current_nz_visa_expiry_date', 'previous_nz_visa_type',
                'preferred_course', 'preferred_qualification_level', 'preferred_city_of_study',
                'preferred_intake', 'english_test_type', 'english_test_overall_score',
                'english_test_listening', 'english_test_reading', 'english_test_writing',
                'english_test_speaking', 'english_test_date', 'target_institution',
                'funding_source', 'estimated_total_cost_nzd', 'available_funds_nzd',
                'supports_partner_or_dependents', 'has_property_in_home_country', 'annual_income_nzd',
                'annual_income_currency', 'bank_funds_evidence_provided',
                'employment_type', 'current_employer_name', 'current_position_title',
                'current_employer_country', 'current_employment_start_date', 'current_salary_nzd',
                'years_of_relevant_experience', 'has_anzsco_listed_role', 'anzsco_code',
                'has_nz_professional_registration', 'nz_professional_registration_body',
                'highest_qualification', 'highest_qualification_field', 'highest_qualification_country',
                'highest_qualification_year_completed', 'has_nzqa_assessment', 'nzqa_assessment_level',
                'has_children', 'number_of_children', 'has_dependent_partner',
                'partner_in_nz', 'intends_to_bring_family',
                'has_health_disclosure', 'health_disclosure_notes',
                'has_character_disclosure', 'character_disclosure_notes',
                'has_been_declined_visa', 'declined_visa_details',
                'has_criminal_record', 'criminal_record_details',
            ];
            // hasColumn guard so down() works on a partially-rolled-back DB.
            foreach ($drops as $col) {
                if (Schema::hasColumn('leads', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }

    /**
     * Re-write existing plain-text passport_number values via Crypt so
     * the model's new `encrypted` cast can decrypt them transparently.
     * Skips rows already encrypted (i.e. anything `Crypt::decryptString`
     * succeeds on) so the step is idempotent if accidentally re-run.
     */
    private function encryptExistingPassportNumbers(): void
    {
        if (! Schema::hasColumn('leads', 'passport_number')) {
            return;
        }

        DB::table('leads')->whereNotNull('passport_number')->orderBy('id')->chunkById(200, function ($rows) {
            foreach ($rows as $row) {
                $value = $row->passport_number;
                // Skip if already encrypted — Crypt::decryptString throws
                // on plain text, which we treat as the "needs encrypt" signal.
                try {
                    Crypt::decryptString($value);
                    continue; // already encrypted
                } catch (\Throwable $e) {
                    // Plain text — encrypt and write back.
                    DB::table('leads')->where('id', $row->id)->update([
                        'passport_number' => Crypt::encryptString($value),
                    ]);
                }
            }
        });
    }

    /**
     * Add-column helper: invoke the schema closure only when the column
     * doesn't already exist. Keeps the up() body readable.
     */
    private function add(Blueprint $table, string $column, \Closure $define): void
    {
        if (Schema::hasColumn('leads', $column)) {
            return;
        }
        $define($table, $column);
    }
};
