<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * An INZ form a case has sent to the client to fill in the lead portal. The
 * client fills the mapped fields (preview of the official PDF alongside); staff/
 * LIA review the answers, then merge them into the official PDF — never
 * auto-filed. field_values is keyed by the PDF field name (from the version map).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('case_form_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignId('inz_form_id')->constrained('inz_forms')->cascadeOnDelete();
            $table->foreignId('inz_form_version_id')->nullable()->constrained('inz_form_versions')->nullOnDelete();
            $table->enum('status', ['assigned', 'submitted', 'reviewed'])->default('assigned');
            $table->json('field_values')->nullable();   // [pdf_field => value] the client entered
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->unique(['lead_id', 'inz_form_id']); // one active assignment per form per case
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('case_form_assignments');
    }
};
