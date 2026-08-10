<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Scheduled reminder emails for a consultation booking (booking_confirmation_2..5).
 * One row per future reminder, with its absolute send time. A per-minute command
 * dispatches the ones whose time has arrived. Same-day bookings simply have
 * fewer rows (past reminders are never stored).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->string('template_key', 80);
            $table->timestamp('send_at');
            $table->string('status', 20)->default('pending'); // pending|sending|sent|failed|canceled
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'send_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_reminders');
    }
};
