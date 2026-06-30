<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Two columns for the custom-form-builder build:
 *
 *   events.form_fields (json)
 *     Per-event form schema. When null, the registration page falls
 *     back to the canonical default field set (see
 *     Event::DEFAULT_FIELDS). When set, replaces the default list
 *     entirely so admins have full control. Each entry is
 *     { key, label, type, required, locked?, default?, enabled?,
 *       placeholder?, hint?, options?, section, order }.
 *
 *   leads.event_response (json)
 *     Catch-all for custom-field responses on event registrations.
 *     Default fields keep mapping to their dedicated columns
 *     (first_name, email, work_info, etc.); fields the admin added
 *     via the field builder land here so we never need a schema
 *     migration to support a new question.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            if (! Schema::hasColumn('events', 'form_fields')) {
                $table->json('form_fields')->nullable()->after('notes');
            }
        });

        Schema::table('leads', function (Blueprint $table) {
            if (! Schema::hasColumn('leads', 'event_response')) {
                $table->json('event_response')->nullable()->after('event_session_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            if (Schema::hasColumn('events', 'form_fields')) {
                $table->dropColumn('form_fields');
            }
        });

        Schema::table('leads', function (Blueprint $table) {
            if (Schema::hasColumn('leads', 'event_response')) {
                $table->dropColumn('event_response');
            }
        });
    }
};
