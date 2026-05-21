<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Follow-up tasks attached to a Lead. Sales/admin schedules a "Call Maria
 * Tuesday 2pm" with assignee + due date. Overdue tasks bubble up on the
 * sales dashboard so leads don't go cold.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->timestamp('due_at')->nullable();
            $table->string('priority', 20)->default('normal'); // low / normal / high / urgent
            $table->boolean('completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['assignee_id', 'completed', 'due_at']);
            $table->index(['lead_id', 'completed']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_tasks');
    }
};
