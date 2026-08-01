<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Offshore INZ application fee.
 *
 * The INZ (government) application fee differs depending on whether the
 * applicant applies onshore or offshore, so offshore gets its own column
 * beside the onshore inz_application_fee. Each location's fee schedule totals
 * with its own INZ charge — see VisaType::feeBreakdown() / inzFeeFor().
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visa_types', function (Blueprint $table) {
            $table->decimal('inz_application_fee_offshore', 10, 2)
                ->nullable()
                ->after('inz_application_fee');
        });
    }

    public function down(): void
    {
        Schema::table('visa_types', function (Blueprint $table) {
            $table->dropColumn('inz_application_fee_offshore');
        });
    }
};
