<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Weekly rent/utilities payments per tenant — one row per (tenant, week_start).
 * week_start is the Monday of the week (canonical bucket key for the rent roll).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accommodation_rent_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('accommodation_tenants')->cascadeOnDelete();
            $table->date('week_start');
            $table->decimal('amount_nzd', 10, 2);
            $table->timestamps();

            $table->unique(['tenant_id', 'week_start']);
            $table->index('week_start');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accommodation_rent_payments');
    }
};
