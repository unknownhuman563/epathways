<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Build 12 phase 4 — attention (§5). Passive telemetry: one row when a staff
 * member opens a case or one of its documents, throttled to one per user per
 * case per 15 minutes. No self-reporting, no "mark as reviewed".
 *
 * duration_s is kept in the schema for a later capability but is deliberately
 * NOT surfaced anywhere — total time-on-case reads as surveillance and buys
 * nothing operationally. The only signal we render is whether (and when) a
 * licensed adviser has looked.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('case_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('opened_at');
            $table->unsignedInteger('duration_s')->nullable(); // schema-only, never rendered
            $table->timestamps();

            $table->index(['lead_id', 'user_id', 'opened_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('case_views');
    }
};
