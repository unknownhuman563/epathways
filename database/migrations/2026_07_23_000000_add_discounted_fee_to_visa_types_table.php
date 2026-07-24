<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Two-tier professional fees on the Visas catalogue.
 *
 * The fee schedule quotes each visa twice — a discounted "pay now" price and
 * a normal "payment plan" price — so a single professional_fees column can't
 * express it. The existing column keeps its meaning as the NORMAL (payment
 * plan) fee, and this adds the discounted counterpart beside it.
 *
 * Both are stored EXCLUSIVE of GST. The GST-inclusive RRP and the
 * "prof fees + INZ fee" total are derived, never stored — see
 * VisaType::feeBreakdown(). Storing them would let the arithmetic drift out
 * of step with the fees it is supposed to summarise.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visa_types', function (Blueprint $table) {
            $table->decimal('professional_fees_discounted', 10, 2)
                ->nullable()
                ->after('professional_fees');
        });
    }

    public function down(): void
    {
        Schema::table('visa_types', function (Blueprint $table) {
            $table->dropColumn('professional_fees_discounted');
        });
    }
};
