<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Build 12 phase 6 — case threads (§7). Anchored questions that stay visible
 * until answered. Not a chat channel: every row anchors to something — the case,
 * a document, a gate, a stage, or a step — or it doesn't get written (enforced in
 * the FormRequest; anchor_type is NOT NULL and has no "general" value).
 *
 * anchor_id  — an integer FK for id-addressable anchors (a LeadDocument).
 * anchor_key — a string for key-addressable anchors (step_key, gate key, stage
 *              name), since a step_key like "06a" is not an integer.
 * anchor_attempt — pins a step thread to a specific attempt (§15.7) when given;
 *              null means the step in general.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('case_threads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->enum('anchor_type', ['case', 'document', 'gate', 'stage', 'step']);
            $table->unsignedBigInteger('anchor_id')->nullable();   // document → LeadDocument id
            $table->string('anchor_key', 60)->nullable();          // step_key / gate key / stage name
            $table->unsignedSmallInteger('anchor_attempt')->nullable(); // step attempt (§15.7)
            $table->foreignId('author_id')->constrained('users');
            $table->foreignId('addressed_to_id')->nullable()->constrained('users');
            $table->text('body');
            $table->boolean('requires_answer')->default(false);
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users');
            $table->timestamps();

            $table->index(['lead_id', 'anchor_type']);
            // Drives the "in my queue" count: open, answer-requiring threads
            // addressed to a person.
            $table->index(['addressed_to_id', 'requires_answer', 'resolved_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('case_threads');
    }
};
