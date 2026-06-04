<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AEWV (Accredited Employer Work Visa) applicant intake.
 * Shape follows the 2026 AEWV Information Form PDF — Sections A through L.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('work_intakes', function (Blueprint $table) {
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
            $table->string('email');
            $table->string('phone');
            $table->string('country_of_citizenship')->nullable();
            $table->string('other_citizenships')->nullable();
            $table->string('national_id')->nullable();
            $table->string('partnership_status', 60)->nullable();

            // Section B — NZ Immigration History
            $table->string('current_country')->nullable();
            $table->string('previous_nz_visa', 10)->nullable(); // Yes/No
            $table->text('previous_nz_visa_details')->nullable();
            $table->string('previous_nzeta', 10)->nullable();
            $table->string('australian_pr', 10)->nullable();
            $table->string('travelled_nz', 10)->nullable();
            $table->date('last_nz_departure')->nullable();
            $table->string('over_24_months', 10)->nullable();

            // Section C — NZ Employer
            $table->string('employer_name')->nullable();
            $table->string('employer_is_family', 10)->nullable();
            $table->string('employer_family_relation')->nullable();
            $table->string('self_employed', 10)->nullable();
            $table->date('job_start_date')->nullable();
            $table->decimal('hourly_rate', 10, 2)->nullable();
            $table->string('supports_dependent_children', 10)->nullable();

            // Section D — Character
            $table->string('character_convicted', 10)->nullable();
            $table->string('character_investigation', 10)->nullable();
            $table->string('character_deported', 10)->nullable();
            $table->string('character_visa_refused', 10)->nullable();
            $table->string('lived_other_country_5y', 10)->nullable();
            $table->text('lived_other_country_details')->nullable();

            // Section E — Health
            $table->string('health_tb', 10)->nullable();
            $table->string('health_renal', 10)->nullable();
            $table->string('health_hospital', 10)->nullable();
            $table->string('health_residential', 10)->nullable();
            $table->string('health_pregnant', 10)->nullable();

            // Section F — Current Employment
            $table->string('currently_working', 10)->nullable();
            $table->string('current_job_title')->nullable();
            $table->text('current_job_duties')->nullable();
            $table->date('current_job_start')->nullable();
            $table->string('current_job_country')->nullable();
            $table->string('current_job_region')->nullable();
            $table->string('current_employer_name')->nullable();
            $table->text('current_employer_address')->nullable();
            $table->string('current_employer_phone')->nullable();
            $table->string('current_employer_email')->nullable();

            // Section G — Previous Employment (up to 2 roles; JSON for flex)
            $table->json('previous_roles')->nullable();

            // Section H — Family Information
            $table->json('family_members')->nullable(); // father, mother, spouse, children[]

            // Section I — NZ Contacts
            $table->string('has_nz_contacts', 10)->nullable();
            $table->json('nz_contacts')->nullable();

            // Section J — Military Service
            $table->string('military_compulsory', 10)->nullable();
            $table->string('military_undertaken', 10)->nullable();
            $table->text('military_details')->nullable();

            // Section K — Travel History (up to 3 trips)
            $table->string('travelled_internationally', 10)->nullable();
            $table->json('travel_trips')->nullable();

            // Section L — Declaration
            $table->boolean('declaration_accepted')->default(false);
            $table->string('signature_name')->nullable();
            $table->date('signature_date')->nullable();

            $table->timestamps();
            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('work_intakes');
    }
};
