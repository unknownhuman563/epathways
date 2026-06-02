<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accommodation_eoi_submissions', function (Blueprint $table) {
            $table->id();

            // Section 1 — Personal
            $table->string('full_legal_name');
            $table->string('id_number');
            $table->string('visa_status');
            $table->string('visa_status_other')->nullable();
            $table->string('nationality');
            $table->string('nationality_other')->nullable();
            $table->string('preferred_name');
            $table->string('email');
            $table->string('mobile');
            $table->unsignedSmallInteger('age');

            // Section 2 — Property & Room Interest
            $table->string('room_type_interest');
            $table->date('tenancy_start_date');
            $table->string('stay_duration');

            // Section 3 — Occupancy
            $table->string('occupants');
            $table->string('occupant_ages');
            $table->boolean('has_children')->default(false);
            $table->string('children_ages')->nullable();
            $table->boolean('has_pets')->default(false);
            $table->string('pet_details')->nullable();

            // Section 4 — Employment / Study
            $table->string('rent_funding')->nullable();
            $table->string('rent_funding_other')->nullable();
            $table->string('employment_status');
            $table->string('employment_status_other')->nullable();

            // Section 5 — Rental Background
            $table->string('current_address');
            $table->boolean('has_rented_before')->default(false);
            $table->string('current_address_duration');
            $table->string('living_situation');
            $table->text('reason_for_moving');

            // Section 6 — Lifestyle & Compatibility
            $table->boolean('smokes_or_vapes')->default(false);
            $table->string('drinks_alcohol');
            $table->string('work_hours');
            $table->text('flatmate_description');

            // Section 7 — Viewing Availability
            $table->boolean('viewing_available_7days')->default(false);
            $table->string('preferred_viewing_time');

            // Section 8 — Declaration & Consent
            $table->boolean('confirm_accurate')->default(false);
            $table->boolean('consent_collection')->default(false);

            // Workflow
            $table->string('status')->default('new'); // new | reviewed | shortlisted | declined

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accommodation_eoi_submissions');
    }
};
