<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The exact UTC moment of the consultation (source of truth for timezone-safe
 * bookings) plus the timezone the client booked from, so both parties can be
 * shown their own local time without mismatching.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->timestamp('appointment_at')->nullable()->after('appointment_time');
            $table->string('client_timezone', 64)->nullable()->after('appointment_at');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['appointment_at', 'client_timezone']);
        });
    }
};
