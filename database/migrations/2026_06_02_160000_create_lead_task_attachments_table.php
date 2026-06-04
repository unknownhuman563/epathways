<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Photos / files attached to a task. Renders inline on the kanban card.
 * Files land in storage/app/public/task-attachments/ so the public
 * symlink (storage:link) serves them under /storage/task-attachments/…
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_task_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_task_id')->constrained('lead_tasks')->cascadeOnDelete();
            $table->string('file_path');
            $table->string('original_filename');
            $table->string('mime_type', 80);
            $table->unsignedInteger('size');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('lead_task_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_task_attachments');
    }
};
