<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The engagement's grand total — our professional fees (incl GST when quoted
 * inclusive) plus every applicant's INZ disbursement — stored at generation
 * time so the Generated Documents table can show a real "Total amount" per
 * engagement. Distinct from engagement_fee_total, which is the ex-GST
 * professional fee alone (drives the editable agreement-fee field).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->decimal('engagement_total_amount', 12, 2)->nullable()->after('engagement_fee_total');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('engagement_total_amount');
        });
    }
};
