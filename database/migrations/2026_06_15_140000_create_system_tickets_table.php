<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_ref')->unique();          // e.g. TKT-AB12CD
            $table->string('title');
            $table->text('description');
            $table->string('category', 20)->default('change'); // change | feature | bug | other
            $table->string('priority', 20)->default('normal'); // low | normal | high | urgent
            $table->string('status', 20)->default('open');     // open | in_review | planned | in_progress | done | declined
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('department', 40)->nullable();      // submitter's role at submit time
            $table->text('admin_response')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'department']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_tickets');
    }
};
