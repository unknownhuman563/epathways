<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_education_exps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            
            $table->string('level'); // High School, Bachelor, Master
            $table->string('institution');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('average_marks')->nullable();
            $table->string('field_of_study')->nullable();
            
            // For gap explanations or uploaded docs tracking
            $table->text('gap_explanation')->nullable();
            $table->json('documents')->nullable(); // Array of document paths
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_education_exps');
    }
};
