<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Emails composed in an event's Email tab but queued to send at a future
 * date/time. A per-minute scheduler fires the due ones to the selected
 * registrants using the same branded send path.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scheduled_event_emails', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedBigInteger('template_id')->nullable();
            $table->string('subject');
            $table->longText('body');
            $table->json('recipient_ids');
            $table->timestamp('scheduled_at');
            $table->string('status', 16)->default('pending'); // pending|sent|canceled|failed
            $table->unsignedInteger('sent_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'scheduled_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_event_emails');
    }
};
