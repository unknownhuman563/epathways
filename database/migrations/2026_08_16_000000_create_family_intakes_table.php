<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Family Visa (Partner or Child) intake — the public "Family Visa Information
 * Form" assessment. Mirrors the other intake tables; fields follow the official
 * ePathways Family Visa Information Form (sections A–H).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('family_intakes', function (Blueprint $table) {
            $table->id();
            $table->string('intake_id')->unique();
            $table->string('status', 40)->default('Submitted');
            $table->string('edit_token', 64)->nullable()->unique();

            // A — Identity
            $table->string('family_name');
            $table->string('first_name');
            $table->string('other_names')->nullable();
            $table->string('gender', 30)->nullable();
            $table->date('dob')->nullable();
            $table->string('country_of_birth')->nullable();
            $table->string('place_of_birth')->nullable();
            $table->string('country_of_citizenship')->nullable();
            $table->string('other_citizenships')->nullable();
            $table->string('national_id')->nullable();
            $table->string('partnership_status', 60)->nullable();

            // B — New Zealand immigration history
            $table->string('current_country')->nullable();
            $table->string('previous_nz_visa', 10)->nullable();
            $table->text('current_address')->nullable();
            $table->string('email');
            $table->string('phone');

            // C — Visa details
            $table->string('applying_as', 20)->nullable(); // partner | child
            $table->string('visa_type')->nullable();
            $table->string('partner_living_together', 10)->nullable();
            $table->string('partner_12_months', 10)->nullable();
            $table->string('partner_same_period', 10)->nullable();
            $table->string('partner_close_relatives', 10)->nullable();
            $table->string('child_dependent', 10)->nullable();

            // D — Character
            $table->string('character_convicted', 10)->nullable();
            $table->string('character_removed', 10)->nullable();
            $table->string('character_investigation', 10)->nullable();
            $table->string('character_visa_refused', 10)->nullable();
            $table->string('lived_other_country_5y', 10)->nullable();
            $table->string('previous_police_certificate', 10)->nullable();

            // E — Health
            $table->string('health_tb', 10)->nullable();
            $table->string('health_renal', 10)->nullable();
            $table->string('health_hospital', 10)->nullable();
            $table->string('health_residential', 10)->nullable();
            $table->string('health_pregnant', 10)->nullable();
            $table->string('countries_visited_3m')->nullable();
            $table->string('previous_xray', 10)->nullable();
            $table->string('previous_medical_cert', 10)->nullable();

            // F — Work history
            $table->string('currently_working', 10)->nullable();
            $table->string('current_employer_name')->nullable();
            $table->text('current_employer_address')->nullable();
            $table->string('current_employer_phone')->nullable();
            $table->string('current_employer_email')->nullable();
            $table->string('current_occupation')->nullable();
            $table->string('current_start')->nullable();
            $table->string('current_end')->nullable();
            $table->json('previous_work')->nullable();

            // G — Other contacts
            $table->text('nz_contacts')->nullable();

            // H — Declaration
            $table->boolean('declaration_accepted')->default(false);
            $table->string('signature_name')->nullable();
            $table->date('signature_date')->nullable();
            $table->boolean('terms_accepted')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('family_intakes');
    }
};
