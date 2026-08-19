<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The invoice's total amount (NZD), stored on the generated invoice document so
 * the Generated Invoices table can show a "Total amount" column without
 * re-opening the PDF. Null for invoices generated before this column existed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_documents', function (Blueprint $table) {
            $table->decimal('invoice_total', 12, 2)->nullable()->after('invoice_number');
        });
    }

    public function down(): void
    {
        Schema::table('lead_documents', function (Blueprint $table) {
            $table->dropColumn('invoice_total');
        });
    }
};
