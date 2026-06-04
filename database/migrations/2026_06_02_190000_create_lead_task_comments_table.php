<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Threaded comments on a task. The kanban card shows a count badge that
 * opens a popover; the popover lists comments oldest-first and lets the
 * viewer add a new one. Author is captured via `user_id`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_task_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_task_id')->constrained('lead_tasks')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('body');
            $table->timestamps();

            $table->index(['lead_task_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_task_comments');
    }
};
