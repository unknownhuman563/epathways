<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// The principal applicant's professional fee override (ex GST) on the
// engagement. Null = use the case visa's fee. Mirrors case_dependents.fee_override.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->decimal('principal_fee_override', 10, 2)->nullable()->after('engagement_total_amount');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('principal_fee_override');
        });
    }
};
