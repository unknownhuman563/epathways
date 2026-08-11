<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * INZ form catalogue + version register. The point of the feature is version
 * tracking: filing a superseded form can get an application returned, so each
 * form carries dated versions with the official PDF, a per-version field map,
 * and the accepted_until date that drives the lapse warning. checked_at records
 * the last time a human verified the current version (INZ doesn't notify).
 *
 * Filling happens against the stored OFFICIAL PDF (AcroForm field-fill) — we
 * never render a look-alike facsimile.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inz_forms', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();          // INZ1012
            $table->string('name');
            $table->string('category', 40)->nullable();     // Student / Work / Visitor / Partnership / Residence / Cross-cutting
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('inz_form_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inz_form_id')->constrained('inz_forms')->cascadeOnDelete();
            $table->string('version_label', 40);            // "November 2025"
            $table->string('file_path')->nullable();        // stored official PDF (null until uploaded)
            $table->boolean('is_acroform')->nullable();     // detected on upload: true = named-field fill, false = overlay
            $table->json('field_map')->nullable();          // per-version map (INZ renames fields between revisions)
            $table->date('effective_from')->nullable();
            $table->date('accepted_until')->nullable();     // supersede grace cut-off → lapse warning
            $table->boolean('is_current')->default(false);
            $table->timestamp('checked_at')->nullable();    // last human verification of "still current"
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['inz_form_id', 'is_current']);
        });

        // Which forms a visa type needs (a visa type usually needs several).
        Schema::create('inz_form_visa_type', function (Blueprint $table) {
            $table->id();
            $table->foreignId('visa_type_id')->constrained('visa_types')->cascadeOnDelete();
            $table->foreignId('inz_form_id')->constrained('inz_forms')->cascadeOnDelete();
            $table->boolean('required')->default(true);
            $table->timestamps();

            $table->unique(['visa_type_id', 'inz_form_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inz_form_visa_type');
        Schema::dropIfExists('inz_form_versions');
        Schema::dropIfExists('inz_forms');
    }
};
