<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resident_intakes', function (Blueprint $table) {
            $table->id();
            $table->string('intake_id')->unique();

            // Personal
            $table->string('first_name');
            $table->string('last_name');
            $table->date('dob');
            $table->string('nationality');
            $table->string('email');
            $table->string('phone');

            // Passport
            $table->string('passport_number');
            $table->date('passport_expiry');
            $table->string('issuing_country');

            // Visa
            $table->string('current_visa_type');
            $table->string('current_visa_other')->nullable();
            $table->date('current_visa_expiry');
            $table->date('nz_arrival_date');
            $table->text('previous_nz_visa_history')->nullable();

            // Employment at Ergo
            $table->string('job_title');
            $table->date('employment_start');
            $table->string('employment_type');
            $table->decimal('hourly_rate', 8, 2);

            // Qualifications
            $table->string('highest_qualification');
            $table->string('institution_name')->nullable();
            $table->string('country_of_study')->nullable();
            $table->string('nzqa_status')->nullable();

            // Experience
            $table->decimal('nz_skilled_years', 5, 1);
            $table->decimal('total_skilled_years', 5, 1);
            $table->text('career_summary')->nullable();

            // English
            $table->string('english_evidence');

            // Family
            $table->string('include_family');

            // Documents checklist (json)
            $table->json('documents')->nullable();

            // Disclosures
            $table->text('character_health_disclosure')->nullable();
            $table->text('other_notes')->nullable();

            $table->string('status')->default('New');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resident_intakes');
    }
};
