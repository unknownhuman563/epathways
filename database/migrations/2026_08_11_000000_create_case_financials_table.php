<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-case financials — the money columns from the immigration dashboard
 * spreadsheet, so staff record fees/invoice once on the case and the system
 * derives total payable, amount owed, and "Account Settled". One row per case;
 * the payment/instalment ledger lives in case_finance_payments.
 *
 * No generated numbers: fees + INZ costs are entered by a human (from the
 * invoice / fee table). The system only does arithmetic on what's entered.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('case_financials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->unique()->constrained('leads')->cascadeOnDelete();
            // Fee breakdown.
            $table->decimal('service_fee_normal', 10, 2)->default(0);      // list / standard
            $table->decimal('service_fee_chargeable', 10, 2)->default(0);  // what's actually charged
            $table->decimal('inz_fee', 10, 2)->default(0);                 // INZ + other disbursements
            $table->decimal('other_fee', 10, 2)->default(0);
            // Disbursement portion that isn't ePathways revenue (defaults to INZ fee when null).
            $table->decimal('disbursement', 10, 2)->nullable();
            $table->enum('payment_type', ['pay_now', 'pay_later'])->nullable();
            $table->string('inz_fee_paid_to', 60)->nullable();  // e.g. Hendry / eP / TD
            $table->string('issued_from', 20)->nullable();      // TD / eP / ePM
            $table->string('invoice_no', 60)->nullable();
            $table->date('invoice_sent_at')->nullable();
            $table->string('currency', 8)->default('NZD');
            $table->text('notes')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('case_financials');
    }
};
