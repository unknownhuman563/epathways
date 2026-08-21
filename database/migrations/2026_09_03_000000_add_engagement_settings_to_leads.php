<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Remember the settings an engagement pack was generated at (location, pricing
// tier, GST, adviser to assist) so re-opening the draft reproduces them exactly
// instead of resetting to defaults.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('engagement_fee_location', 20)->nullable()->after('engagement_total_amount');
            $table->string('engagement_fee_tier', 20)->nullable()->after('engagement_fee_location');
            $table->boolean('engagement_include_gst')->default(false)->after('engagement_fee_tier');
            $table->unsignedBigInteger('engagement_assist_signer_id')->nullable()->after('engagement_include_gst');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['engagement_fee_location', 'engagement_fee_tier', 'engagement_include_gst', 'engagement_assist_signer_id']);
        });
    }
};
