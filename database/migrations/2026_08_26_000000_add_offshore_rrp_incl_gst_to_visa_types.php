<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-visa, display-only preference for how the OFFSHORE professional-fee RRP
 * column is shown in the visa admin: GST-inclusive (default, RRP = fee x 1.15)
 * or GST-exclusive (RRP = the stored fee). Purely presentational — the stored
 * fee stays GST-exclusive and every derived total is unchanged.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visa_types', function (Blueprint $table) {
            $table->boolean('offshore_rrp_incl_gst')->default(true)->after('professional_fees_discounted_offshore');
        });
    }

    public function down(): void
    {
        Schema::table('visa_types', function (Blueprint $table) {
            $table->dropColumn('offshore_rrp_incl_gst');
        });
    }
};
