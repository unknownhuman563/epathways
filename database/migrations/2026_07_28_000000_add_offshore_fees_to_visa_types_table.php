<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Onshore / offshore professional fees on the Visas catalogue.
 *
 * Each visa is quoted differently depending on whether the applicant is
 * already in New Zealand (onshore) or applying from abroad (offshore). The
 * existing two columns keep their meaning as the ONSHORE fees; this adds the
 * offshore counterparts beside them:
 *
 *   professional_fees                       → onshore, normal (payment plan)
 *   professional_fees_discounted            → onshore, discounted (pay now)
 *   professional_fees_offshore              → offshore, normal (payment plan)
 *   professional_fees_discounted_offshore   → offshore, discounted (pay now)
 *
 * All four are stored EXCLUSIVE of GST. The GST-inclusive RRP and totals are
 * derived, never stored — see VisaType::feeBreakdown(). The offshore INZ fee
 * is added separately in a later migration.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visa_types', function (Blueprint $table) {
            $table->decimal('professional_fees_offshore', 10, 2)
                ->nullable()
                ->after('professional_fees_discounted');
            $table->decimal('professional_fees_discounted_offshore', 10, 2)
                ->nullable()
                ->after('professional_fees_offshore');
        });
    }

    public function down(): void
    {
        Schema::table('visa_types', function (Blueprint $table) {
            $table->dropColumn(['professional_fees_offshore', 'professional_fees_discounted_offshore']);
        });
    }
};
