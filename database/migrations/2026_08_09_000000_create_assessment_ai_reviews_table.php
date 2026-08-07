<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AI completeness/consistency review of a visa-assessment intake. INTERNAL and
 * INDICATIVE only — observations for the licensed adviser to review, never an
 * eligibility decision and never client-facing (immigration AI guardrails §1,
 * §2). Stored per intake (polymorphic) with the reviewer + model recorded for
 * auditability (guardrail §11). Append-only in spirit: each run is a new row.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_ai_reviews', function (Blueprint $table) {
            $table->id();
            $table->string('intakeable_type');
            $table->unsignedBigInteger('intakeable_id');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('provider')->default('openrouter');
            $table->string('model')->nullable();
            // [{severity: check|info, field, note}] — observations, not judgments.
            $table->json('observations')->nullable();
            $table->text('summary')->nullable();
            $table->longText('raw')->nullable(); // raw model reply, for audit
            $table->timestamps();

            $table->index(['intakeable_type', 'intakeable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_ai_reviews');
    }
};
