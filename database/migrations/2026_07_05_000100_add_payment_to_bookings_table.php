<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bookings carry a payment state so a consultation can be saved (and appear in
 * the portal) before it's paid. Stripe Checkout fills in the rest.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('payment_status', 16)->default('unpaid')->after('status'); // unpaid|paid|refunded
            $table->decimal('amount', 10, 2)->nullable()->after('payment_status');
            $table->string('currency', 3)->nullable()->after('amount');
            $table->string('stripe_session_id')->nullable()->after('currency');
            $table->timestamp('paid_at')->nullable()->after('stripe_session_id');

            $table->index('payment_status');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['payment_status', 'amount', 'currency', 'stripe_session_id', 'paid_at']);
        });
    }
};
