<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Visa-type-agnostic "applicant journey" record. Wraps any intake form
 * (currently ResidentIntake; future StudentIntake / WorkIntake / VisitorIntake)
 * via the polymorphic intakeable_* columns, and is the canonical home for
 * locked pricing + payment status + the chosen consultation booking.
 *
 * URLs that gate on a public token (Pay / Book / Booked) read from this
 * table — the form-specific table is only used to render the intake itself.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessments', function (Blueprint $table) {
            $table->id();
            $table->string('token', 64)->unique();
            $table->foreignId('visa_type_id')->constrained();

            // Polymorphic link to whichever form was filled out.
            $table->nullableMorphs('intakeable');

            // Snapshot of applicant identity — duplicated from the morphed
            // intake row so the assessment page works without loading it.
            $table->string('applicant_first_name')->nullable();
            $table->string('applicant_last_name')->nullable();
            $table->string('applicant_email');
            $table->string('applicant_phone')->nullable();
            $table->string('applicant_country')->nullable();

            // Locked pricing — see Assessment::lockCurrentPrice + the payment
            // page's expiry refresh logic.
            $table->decimal('locked_price_nzd', 8, 2)->nullable();
            $table->timestamp('locked_price_at')->nullable();
            $table->timestamp('locked_price_expires_at')->nullable();

            // Payment.
            $table->string('payment_status', 20)->default('pending'); // pending | paid | failed
            $table->string('payment_session_id')->nullable();
            $table->unsignedInteger('payment_amount_cents')->nullable();
            $table->string('payment_currency', 3)->nullable();
            $table->timestamp('paid_at')->nullable();

            // Booking.
            $table->foreignId('booking_id')->nullable()->constrained()->nullOnDelete();

            // Lifecycle: draft → submitted → paid → booked → completed / cancelled.
            $table->string('status', 20)->default('submitted');

            $table->timestamps();

            $table->index('applicant_email');
            $table->index('payment_status');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessments');
    }
};
