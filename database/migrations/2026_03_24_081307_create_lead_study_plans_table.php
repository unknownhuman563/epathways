<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_study_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            
            $table->string('preferred_course');
            $table->string('qualification_level');
            $table->string('preferred_city')->nullable();
            $table->string('preferred_intake')->nullable();
            
            $table->boolean('english_test_taken')->default(false);
            $table->string('english_test_type')->nullable(); // IELTS, PTE
            $table->date('english_test_date')->nullable();
            $table->string('score_overall')->nullable();
            $table->string('score_reading')->nullable();
            $table->string('score_listening')->nullable();
            $table->string('score_writing')->nullable();
            $table->string('score_speaking')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_study_plans');
    }
};
