<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Google Calendar event + Meet link for a consultation booking. Populated by
 * the CreateBookingCalendarEvent job (dormant until Calendar delegation is
 * configured). `google_event_id` makes the push idempotent.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('google_event_id', 191)->nullable()->after('client_timezone');
            $table->string('meet_link', 512)->nullable()->after('google_event_id');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['google_event_id', 'meet_link']);
        });
    }
};
