<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Per-applicant INZ disbursement override. Null = use the visa's INZ fee.
// Lets staff set each family member's disbursement on the engagement individually.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('case_dependents', function (Blueprint $table) {
            $table->decimal('disbursement_override', 10, 2)->nullable()->after('fee_override');
        });
    }

    public function down(): void
    {
        Schema::table('case_dependents', function (Blueprint $table) {
            $table->dropColumn('disbursement_override');
        });
    }
};
