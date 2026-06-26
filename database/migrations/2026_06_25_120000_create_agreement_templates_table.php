<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Build 11.D Phase 2 — Agreement templates.
 *
 * Distinct from app/Services/AgreementGenerator which renders fixed Blade
 * templates (Consultancy / English Engagement) as LeadDocument rows.
 * This table powers the new managed-agreement workflow: DB-stored
 * templates with {{variable}} placeholders, paired with the agreements
 * table for the draft → sent → signed lifecycle.
 *
 * visa_type is the human-readable name string that matches leads.inz_visa_type
 * (which is a free-form string, not a FK). null = generic / cross-visa.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agreement_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('visa_type')->nullable();
            $table->longText('body');
            $table->json('required_variables')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('visa_type');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agreement_templates');
    }
};
