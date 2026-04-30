<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('programs', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('institution');
            $table->string('location')->nullable();
            $table->unsignedTinyInteger('level');
            $table->enum('category', ['diplomas', 'bachelors', 'masters']);
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->string('price_text')->nullable();
            $table->string('image')->nullable();
            $table->text('description')->nullable();
            $table->string('intake_months')->nullable();
            $table->unsignedSmallInteger('duration_months')->nullable();
            $table->unsignedSmallInteger('credits')->nullable();
            $table->unsignedTinyInteger('residency_points')->nullable();
            $table->unsignedTinyInteger('hours_per_week')->nullable();
            $table->text('entry_requirements')->nullable();
            $table->text('employment_outcomes')->nullable();
            $table->text('post_study')->nullable();
            $table->json('fee_guide')->nullable();
            $table->decimal('insurance_fee', 10, 2)->nullable();
            $table->decimal('visa_processing_fee', 10, 2)->nullable();
            $table->decimal('living_expense', 10, 2)->nullable();
            $table->string('accommodation')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('programs');
    }
};
