<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-department CTA action links baked onto the footer image: the BOOK NOW
 * button's destination (booking_url) and the CALL button's number (call_number).
 * Null falls back to the global services.contact.* config.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('email_brandings', function (Blueprint $table) {
            $table->string('booking_url')->nullable()->after('footer_path');
            $table->string('call_number', 40)->nullable()->after('booking_url');
        });
    }

    public function down(): void
    {
        Schema::table('email_brandings', function (Blueprint $table) {
            $table->dropColumn(['booking_url', 'call_number']);
        });
    }
};
