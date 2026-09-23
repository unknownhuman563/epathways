<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Generated Exalt flat/house-sharing agreements (Whole-Property, Transient
 * short-term, Standard long-term). Built in the Forms → Agreements module from
 * a pre-tenancy submission (general or onboarding), previewed live, then
 * generated as a stored PDF. When the client has an onboarding record, the
 * agreement links to it so the onboarding Agreement stage can source it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accommodation_agreements', function (Blueprint $table) {
            $table->id();
            $table->string('agreement_type');   // whole_property | transient_flatmate | standard_flatmate

            // Source pre-tenancy submission — exactly one of these is set.
            $table->foreignId('pre_tenancy_form_id')->nullable()->constrained('pre_tenancy_forms')->nullOnDelete();
            $table->foreignId('eoi_submission_id')->nullable()->constrained('accommodation_eoi_submissions')->nullOnDelete();

            $table->string('client_name')->nullable();
            $table->string('property_address', 500)->nullable();
            $table->json('data')->nullable();   // full snapshot of the filled agreement fields

            $table->string('status')->default('draft');   // draft | generated | sent | signed
            $table->string('pdf_path')->nullable();        // private disk path once generated
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('signed_at')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('agreement_type');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accommodation_agreements');
    }
};
