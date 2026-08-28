<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('message_templates', function (Blueprint $table) {
            // Optional per-template Reply-To. When set, replies to this
            // template's emails route to this address/name instead of the
            // From address (and take precedence over the central
            // services.contact.reply_to fallback). Null = fall back to that
            // central inbox, else the From address.
            if (! Schema::hasColumn('message_templates', 'reply_to_email')) {
                $table->string('reply_to_email')->nullable()->after('from_name');
            }
            if (! Schema::hasColumn('message_templates', 'reply_to_name')) {
                $table->string('reply_to_name')->nullable()->after('reply_to_email');
            }
        });
    }

    public function down(): void
    {
        Schema::table('message_templates', function (Blueprint $table) {
            $table->dropColumn(['reply_to_email', 'reply_to_name']);
        });
    }
};
