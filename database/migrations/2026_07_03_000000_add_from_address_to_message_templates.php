<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('message_templates', function (Blueprint $table) {
            // Optional per-template sender. Null = the app's default MAIL_FROM.
            // Lets e.g. the event_registration template send from a different
            // verified address (hello@epathways.ph) than support@.
            $table->string('from_email')->nullable()->after('email_body');
            $table->string('from_name')->nullable()->after('from_email');
        });
    }

    public function down(): void
    {
        Schema::table('message_templates', function (Blueprint $table) {
            $table->dropColumn(['from_email', 'from_name']);
        });
    }
};
