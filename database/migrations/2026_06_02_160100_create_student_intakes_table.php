<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Student Visa (SV) applicant intake.
 * Shape follows the 2026 SV Information Form PDF — Sections A through M.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_intakes', function (Blueprint $table) {
            $table->id();
            $table->string('intake_id')->unique();
            $table->string('status', 40)->default('New');
            $table->string('edit_token', 64)->nullable()->unique();

            // Section A — Identity
            $table->string('family_name');
            $table->string('first_name');
            $table->string('other_names')->nullable();
            $table->string('gender', 30)->nullable();
            $table->date('dob');
            $table->string('country_of_birth')->nullable();
            $table->string('place_of_birth')->nullable();
            $table->text('current_address')->nullable();
            $table->text('overseas_address')->nullable();
            $table->string('email');
            $table->string('phone');
            $table->string('country_of_citizenship')->nullable();
            $table->string('other_citizenships')->nullable();
            $table->string('national_id')->nullable();
            $table->string('passport_number')->nullable();
            $table->date('passport_expiry')->nullable();
            $table->string('partnership_status', 60)->nullable();

            // Section B — NZ Immigration History
            $table->string('current_country')->nullable();
            $table->json('previous_nz_visas')->nullable();
            $table->json('previous_nzeta')->nullable();
            $table->json('australian_pr')->nullable();
            $table->string('travelled_nz', 10)->nullable();
            $table->date('last_nz_departure')->nullable();
            $table->string('over_24_months', 10)->nullable();

            // Section C — Character
            $table->string('character_convicted', 10)->nullable();
            $table->string('character_investigation', 10)->nullable();
            $table->string('character_deported', 10)->nullable();
            $table->string('character_visa_refused', 10)->nullable();
            $table->string('lived_other_country_5y', 10)->nullable();
            $table->text('lived_other_country_details')->nullable();

            // Section D — Health
            $table->string('health_tb', 10)->nullable();
            $table->string('health_renal', 10)->nullable();
            $table->string('health_hospital', 10)->nullable();
            $table->string('health_residential', 10)->nullable();
            $table->string('health_pregnant', 10)->nullable();

            // Section E — Education (up to 3 qualifications)
            $table->json('qualifications')->nullable();

            // Section F — Current/Previous Employment
            $table->string('currently_working', 10)->nullable();
            $table->string('current_job_title')->nullable();
            $table->text('current_job_duties')->nullable();
            $table->date('current_job_start')->nullable();
            $table->date('current_job_finish')->nullable();
            $table->string('current_job_country')->nullable();
            $table->string('current_job_region')->nullable();
            $table->string('current_employer_name')->nullable();
            $table->text('current_employer_address')->nullable();
            $table->string('current_employer_phone')->nullable();
            $table->string('current_employer_email')->nullable();

            // Section G — Family Information
            $table->json('family_members')->nullable();

            // Section H — NZ Contacts
            $table->string('has_nz_contacts', 10)->nullable();
            $table->json('nz_contacts')->nullable();

            // Section I — Military
            $table->string('military_compulsory', 10)->nullable();
            $table->string('military_undertaken', 10)->nullable();
            $table->text('military_details')->nullable();

            // Section J — Travel History
            $table->string('travelled_internationally', 10)->nullable();
            $table->json('travel_trips')->nullable();

            // Section K — Study Plan
            $table->text('programmes')->nullable();
            $table->date('study_period_from')->nullable();
            $table->date('study_period_to')->nullable();
            $table->string('school_name')->nullable();
            $table->string('has_offer', 10)->nullable();

            // Section L — Study Funds and Assets
            $table->string('has_enough_funds', 10)->nullable();
            $table->decimal('tuition_fee_nzd', 12, 2)->nullable();
            $table->json('available_funds')->nullable(); // bank/cash, savings, fixed deposit, etc.
            $table->decimal('living_expenses_nzd', 12, 2)->nullable();
            $table->string('has_sponsor', 10)->nullable();
            $table->string('sponsor_relationship')->nullable();
            $table->string('sponsor_income_source')->nullable();
            $table->string('can_provide_statements', 10)->nullable();
            $table->string('has_other_assets', 10)->nullable();
            $table->text('other_assets_details')->nullable();

            // Section M — Declaration
            $table->boolean('declaration_accepted')->default(false);
            $table->string('signature_name')->nullable();
            $table->date('signature_date')->nullable();

            $table->timestamps();
            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_intakes');
    }
};
