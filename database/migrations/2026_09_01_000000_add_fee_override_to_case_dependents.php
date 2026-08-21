<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Per-applicant professional fee override (ex GST). Null = use the visa's fee.
// Lets staff set each family member's amount on the engagement individually.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('case_dependents', function (Blueprint $table) {
            $table->decimal('fee_override', 10, 2)->nullable()->after('in_agreement');
        });
    }

    public function down(): void
    {
        Schema::table('case_dependents', function (Blueprint $table) {
            $table->dropColumn('fee_override');
        });
    }
};
