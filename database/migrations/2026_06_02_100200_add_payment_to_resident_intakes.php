<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resident_intakes', function (Blueprint $table) {
            // pending | paid | failed
            $table->string('payment_status', 20)->default('pending')->after('status');
            // Stripe Checkout Session ID — the bearer the success callback uses
            // to verify with Stripe before marking paid.
            $table->string('payment_session_id')->nullable()->after('payment_status');
            // Amount captured at submit time so the displayed/charged fee stays
            // stable even if an admin later edits the setting.
            $table->unsignedInteger('payment_amount_cents')->nullable()->after('payment_session_id');
            $table->string('payment_currency', 3)->nullable()->after('payment_amount_cents');
            $table->timestamp('paid_at')->nullable()->after('payment_currency');
            // FK to the booking the applicant claimed after payment.
            $table->foreignId('booking_id')->nullable()->after('paid_at')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('resident_intakes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('booking_id');
            $table->dropColumn([
                'payment_status',
                'payment_session_id',
                'payment_amount_cents',
                'payment_currency',
                'paid_at',
            ]);
        });
    }
};
