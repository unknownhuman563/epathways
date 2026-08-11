<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One-time-per-person config (the "yellow cells" in the sheet).
        Schema::create('dtr_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('label')->nullable();          // custom DTR name
            $table->string('position')->nullable();
            $table->string('team')->nullable();
            $table->string('timezone', 64)->default('Asia/Manila');
            $table->string('sched_in', 8)->nullable();    // "HH:MM" duty start
            $table->string('sched_out', 8)->nullable();   // "HH:MM" duty end
            $table->decimal('break_hours', 4, 2)->default(1.00);
            $table->string('reports_to')->nullable();
            $table->decimal('std_hours', 4, 2)->default(8.00);
            $table->unsignedSmallInteger('grace_mins')->default(10);
            $table->decimal('break_after', 4, 2)->default(6.00); // break kicks in past this
            $table->boolean('is_complete')->default(false);
            $table->timestamps();
        });

        // One row per person per working day.
        Schema::create('dtr_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('work_date');
            $table->string('time_in', 8)->nullable();     // "HH:MM" (24h)
            $table->string('time_out', 8)->nullable();    // "HH:MM" (24h)
            $table->json('tasks')->nullable();            // [{task, pending}, …] up to 10
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'work_date']);
            $table->index('work_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dtr_entries');
        Schema::dropIfExists('dtr_settings');
    }
};
