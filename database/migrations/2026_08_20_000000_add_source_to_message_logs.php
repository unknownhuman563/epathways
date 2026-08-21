<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tags a message_log with what produced it, so the Compose module can show a
 * dedicated "sent from Compose" history without mixing in template/stage/campaign
 * sends. NULL = the existing sends (unchanged); 'compose' = the manual composer.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('message_logs', function (Blueprint $table) {
            $table->string('source', 20)->nullable()->index()->after('template_key');
        });
    }

    public function down(): void
    {
        Schema::table('message_logs', function (Blueprint $table) {
            $table->dropIndex(['source']);
            $table->dropColumn('source');
        });
    }
};
