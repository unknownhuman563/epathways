<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * When the engagement pack's signing link was emailed to the client. Null means
 * the pack is a DRAFT (generated but not sent) — the client link is withheld
 * until it is emailed from the manage-draft modal.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->timestamp('engagement_sent_at')->nullable()->after('engagement_signing_token');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('engagement_sent_at');
        });
    }
};
