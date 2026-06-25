<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('english_classes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            // Instructor is any portal:english-capable user. Nullable so a
            // class can be drafted before an instructor is assigned.
            $table->foreignId('instructor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('schedule_text')->nullable();   // e.g. "Mon/Wed 6-8pm"
            $table->text('location')->nullable();
            $table->unsignedInteger('capacity')->default(0);
            $table->string('status', 20)->default('scheduled'); // scheduled/in_progress/completed/cancelled
            $table->date('starts_at')->nullable();
            $table->date('ends_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('english_class_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('english_class_id')->constrained('english_classes')->cascadeOnDelete();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->timestamp('enrolled_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->string('status', 20)->default('active'); // active/completed/withdrawn
            $table->text('notes')->nullable();
            $table->timestamps();

            // A learner is enrolled in a given class at most once.
            $table->unique(['english_class_id', 'lead_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('english_class_enrollments');
        Schema::dropIfExists('english_classes');
    }
};
