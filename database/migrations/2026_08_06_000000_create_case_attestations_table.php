<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Build 12 phase 5 — advice-bearing attestations. ONE table for both the case
 * verdict and the lodgement sign-off, because both are advice-bearing and gated
 * by the same AdviceBearingPolicy (§15.2). Every row requires a current licence
 * — no exceptions, no step_key. Append-only: a changed verdict is a new row with
 * supersedes_id set, never an update.
 *
 * QC stamps do NOT live here — they are procedural, on case_step_states.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('case_attestations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignId('adviser_id')->constrained('users');
            $table->enum('type', ['verdict', 'lodgement_signoff']);
            // Present only for type=verdict.
            $table->enum('verdict', ['good_to_go', 'needs_something', 'cannot_endorse'])->nullable();
            $table->text('reason')->nullable();
            $table->foreignId('supersedes_id')->nullable()->constrained('case_attestations');
            $table->timestamps();

            $table->index(['lead_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('case_attestations');
    }
};
