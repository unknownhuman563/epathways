<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Finance portal accounting module — standalone Accounts Receivable (money
 * clients owe ePathways) and Accounts Payable (money ePathways owes vendors),
 * with a shared polymorphic payment ledger. Totals (paid / balance / aging) are
 * always derived from the payment rows — no figure is stored twice.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Accounts Receivable — invoices issued to clients.
        Schema::create('finance_receivables', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_no')->unique();
            $table->foreignId('lead_id')->nullable()->constrained()->nullOnDelete(); // optional client link
            $table->string('client_name');
            $table->text('description')->nullable();
            $table->string('currency', 3)->default('NZD');
            $table->decimal('amount', 12, 2)->default(0);         // total invoiced
            $table->date('issue_date');
            $table->date('due_date');
            $table->string('status', 20)->default('draft');       // draft | sent | paid | void
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['status', 'due_date']);
        });

        // Accounts Payable — bills owed to vendors / suppliers.
        Schema::create('finance_payables', function (Blueprint $table) {
            $table->id();
            $table->string('bill_no')->unique();
            $table->string('vendor_name');
            $table->string('category')->nullable();
            $table->text('description')->nullable();
            $table->string('currency', 3)->default('NZD');
            $table->decimal('amount', 12, 2)->default(0);
            $table->date('issue_date');
            $table->date('due_date');
            $table->string('status', 20)->default('draft');       // draft | approved | paid | void
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['status', 'due_date']);
        });

        // Shared payment ledger — one row per payment against a receivable or payable.
        Schema::create('finance_payments', function (Blueprint $table) {
            $table->id();
            $table->morphs('paymentable'); // paymentable_type + paymentable_id
            $table->decimal('amount', 12, 2);
            $table->date('paid_on');
            $table->string('method')->nullable();      // bank transfer / cash / card / …
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finance_payments');
        Schema::dropIfExists('finance_payables');
        Schema::dropIfExists('finance_receivables');
    }
};
