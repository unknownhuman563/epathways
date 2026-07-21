<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sequential invoice number (e.g. INV-0117) stamped on generated tax
 * invoices so the next one can be derived without parsing filenames.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_documents', function (Blueprint $table) {
            $table->string('invoice_number', 40)->nullable()->after('source_variant');
            $table->index('invoice_number');
        });
    }

    public function down(): void
    {
        Schema::table('lead_documents', function (Blueprint $table) {
            $table->dropIndex(['invoice_number']);
            $table->dropColumn('invoice_number');
        });
    }
};
