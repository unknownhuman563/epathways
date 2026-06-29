<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Links a message_log row to the bulk campaign that produced it (null for the
 * one-off / templated sends), so a campaign's per-recipient history and counts
 * can be derived.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('message_logs', function (Blueprint $table) {
            $table->foreignId('campaign_id')->nullable()->after('template_key')
                ->constrained('email_campaigns')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('message_logs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('campaign_id');
        });
    }
};
