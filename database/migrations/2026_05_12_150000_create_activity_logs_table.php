<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * A single audit trail for actions across the admin area and every
     * department portal (sales / education / english / immigration / accommodation).
     */
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('actor_name')->nullable();   // snapshot of who acted (survives user deletion)
            $table->string('portal')->nullable();       // admin | sales | education | english | immigration | accommodation | public
            $table->string('action');                   // e.g. login, logout, portal.viewed, user.created
            $table->string('description')->nullable();  // human-readable summary
            $table->json('properties')->nullable();     // optional extra context
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('portal');
            $table->index('action');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
