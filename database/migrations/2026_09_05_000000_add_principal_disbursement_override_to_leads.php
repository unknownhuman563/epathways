<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Principal applicant's INZ disbursement override on the engagement.
// Null = use the visa's INZ fee. Mirrors principal_fee_override.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->decimal('principal_disbursement_override', 10, 2)->nullable()->after('principal_fee_override');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('principal_disbursement_override');
        });
    }
};
