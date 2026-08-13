<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_notes', function (Blueprint $table) {
            $table->id();
            // Polymorphic owner — a visa intake (ResidentIntake, WorkIntake, …)
            // OR a free-assessment Lead. Author attribution is captured inline so
            // the note survives even if the user is later renamed or removed.
            $table->morphs('notable');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('author_name')->nullable();
            $table->string('author_role')->nullable();
            $table->text('body');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_notes');
    }
};
