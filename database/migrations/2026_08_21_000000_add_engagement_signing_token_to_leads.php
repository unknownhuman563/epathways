<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A per-lead bearer token for the standalone engagement-signing link emailed to
 * the client. It grants access to ONLY that lead's engagement-pack documents
 * (Written Agreement + IAA standards etc.) for viewing/signing — a bounded,
 * intentional disclosure, distinct from the (case-excluded) public tracker.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('engagement_signing_token', 64)->nullable()->unique()->after('tracking_code');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('engagement_signing_token');
        });
    }
};
