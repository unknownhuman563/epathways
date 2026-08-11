<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The payment / instalment ledger for a case (replaces the spreadsheet's
 * "Instalment 1/2/3 · Date Paid · Amount · Pending" columns). Each row is one
 * receipt; the case's total paid / owed / settled state is derived from the sum.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('case_finance_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->date('paid_at');
            $table->decimal('amount', 10, 2);
            $table->string('method', 40)->nullable();     // bank transfer, CC, cash…
            $table->string('reference', 120)->nullable(); // e.g. "Instalment 1", receipt no.
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['lead_id', 'paid_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('case_finance_payments');
    }
};
