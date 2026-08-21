<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Extra "To" recipients for a template. The lead is always the primary
 * recipient; these comma-separated addresses are added to the To line on every
 * send (e.g. so the internal team receives the same email as the client).
 * Mirrors the existing cc / bcc columns.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('message_templates', function (Blueprint $table) {
            $table->text('to_extra')->nullable()->after('footer_image');
        });
    }

    public function down(): void
    {
        Schema::table('message_templates', function (Blueprint $table) {
            $table->dropColumn('to_extra');
        });
    }
};
