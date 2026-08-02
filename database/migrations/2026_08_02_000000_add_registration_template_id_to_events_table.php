<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-event registration confirmation template. When set, a registrant on this
 * event receives THIS template instead of the global 'event_registration' one.
 * Null → fall back to the shared 'event_registration' template.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->foreignId('registration_template_id')->nullable()->after('form_fields')
                ->constrained('message_templates')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropConstrainedForeignId('registration_template_id');
        });
    }
};
