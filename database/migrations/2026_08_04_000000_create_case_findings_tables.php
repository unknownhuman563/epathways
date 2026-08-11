<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Build 12 phase 3 — case assist (findings). One shared list per case, written
 * by the rules engine (source=rule) now; the schema also supports source=ai for
 * a later phase, but nothing writes those yet.
 *
 * Findings are never deleted — a resolved one has its status changed. A stable
 * finding_key per rule means a recurring finding updates last_seen_at rather
 * than duplicating (unique lead_id + finding_key).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('case_findings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            // Stable per rule + subject, e.g. "checklist_missing:police_cert".
            $table->string('finding_key', 120);
            $table->string('category', 60)->nullable();
            $table->enum('severity', ['blocking', 'check', 'info'])->default('check');
            $table->string('title', 200);
            $table->text('detail')->nullable();
            // Document ids, page refs, field paths — the provenance line.
            $table->json('evidence')->nullable();
            $table->enum('source', ['rule', 'ai'])->default('rule');
            $table->enum('audience', ['staff', 'adviser', 'both'])->default('staff');
            $table->enum('status', ['open', 'actioned', 'dismissed'])->default('open');
            $table->foreignId('actioned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('actioned_at')->nullable();
            $table->text('dismiss_reason')->nullable();
            $table->timestamp('first_seen_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            $table->unique(['lead_id', 'finding_key']);
            $table->index(['lead_id', 'status']);
        });

        // One row per case: when findings were last evaluated, and what the
        // evaluation could NOT check (rendered as the required "couldn't verify"
        // line so the panel never reads as "clean" when it means "nothing found
        // in what I could read").
        Schema::create('case_finding_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->unique()->constrained('leads')->cascadeOnDelete();
            $table->timestamp('evaluated_at')->nullable();
            $table->json('couldnt_verify')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('case_finding_runs');
        Schema::dropIfExists('case_findings');
    }
};
