<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bulk-email campaigns. A campaign freezes the template's subject/body at
 * compose time (so later template edits don't rewrite history), snapshots the
 * chosen recipients, and is either sent immediately or dispatched by the
 * scheduler at scheduled_at. Per-recipient delivery is tracked via
 * message_logs.campaign_id.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('department')->default('');           // '' = shared/global, else owning dept
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('template_id')->nullable()->constrained('message_templates')->nullOnDelete();
            $table->string('subject');                            // frozen snapshot (with {{vars}})
            $table->longText('body');                             // frozen snapshot (markdown, with {{vars}})
            $table->string('status')->default('draft')->index();  // draft|scheduled|sending|sent|failed|canceled
            $table->timestamp('scheduled_at')->nullable()->index();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedInteger('total_recipients')->default(0);
            $table->unsignedInteger('sent_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->json('recipient_lead_ids')->nullable();       // snapshot of selected lead ids
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_campaigns');
    }
};
