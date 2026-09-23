<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Standalone ("general") pre-tenancy form submissions — people who skipped the
 * hot-lead funnel and filled the pre-tenancy form straight from a shared link.
 * Onboarding tenants keep storing their pre-tenancy data on the EoiSubmission;
 * these two sources are merged into one client list in the Agreements module.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pre_tenancy_forms', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();      // human-friendly code, e.g. PT-XXXXXX
            $table->string('full_legal_name')->nullable();
            $table->string('email')->nullable();
            $table->string('mobile')->nullable();
            $table->string('current_address', 500)->nullable();
            $table->string('property_address', 500)->nullable();
            $table->json('data')->nullable();           // full submission payload (same shape as EoiSubmission.pre_tenancy_form_data)
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->index('email');
            $table->index('submitted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pre_tenancy_forms');
    }
};
