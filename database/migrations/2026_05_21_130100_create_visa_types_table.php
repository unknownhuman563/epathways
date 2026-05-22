<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * INZ visa types + expected processing windows. Drives the dashboard's
 * lodgement-aging buckets (green/amber/red) — without these, we can't
 * know whether an INZ case is "approaching limit" or "exceeded".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visa_types', function (Blueprint $table) {
            $table->id();
            $table->string('code', 60)->unique();
            $table->string('name', 160);
            $table->string('category', 60)->nullable(); // Student | Work | Resident | Visitor | Partner | Other
            $table->integer('expected_processing_days')->default(40); // working days
            $table->string('inz_form_refs')->nullable(); // e.g. "INZ1012, INZ1226"
            $table->text('notes')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visa_types');
    }
};
