<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Build 11.D Phase 2 — Agreements.
 *
 * One row per generated agreement. Holds the rendered content (post
 * variable substitution), the PDF path, the lifecycle status, and —
 * once Phase 3 signing lands — the signer audit fields (ip, ua, typed
 * name, canvas signature data, signed PDF path).
 *
 * tracker_signing_token is the 48-char random string the client uses to
 * open the tracker signing URL. Single-use semantically: it remains
 * resolvable post-sign for the confirmation page, but the controller
 * rejects new sign attempts once status='signed'.
 *
 * lead_id cascades on delete: removing a Lead removes its agreements
 * (same as documents, notes, etc.). Generated PDFs in storage are NOT
 * automatically cleaned up — left to a future GC step if needed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agreements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('agreement_template_id')->constrained();
            $table->foreignId('generated_by_user_id')->constrained('users');

            $table->string('title');
            $table->longText('content_rendered');
            $table->string('pdf_path')->nullable();

            // Lifecycle: draft → sent → viewed → signed (or voided / expired)
            $table->string('status', 16)->default('draft');

            $table->timestamp('sent_at')->nullable();
            $table->timestamp('viewed_at')->nullable();
            $table->timestamp('signed_at')->nullable();

            // Signer audit fields populated in Phase 3.
            $table->string('signer_name')->nullable();
            $table->string('signer_ip')->nullable();
            $table->string('signer_user_agent')->nullable();
            $table->longText('signature_data')->nullable();
            $table->string('signed_pdf_path')->nullable();

            // Snapshot of the variable map at generation time — audit trail.
            $table->json('variables_used')->nullable();

            // Tracker signing token for the client-facing /track/{code}/agreements/{token}/sign URL.
            // Random 48-char string; opaque to the client.
            $table->string('tracker_signing_token', 64)->nullable()->unique();

            $table->timestamps();

            $table->index(['lead_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agreements');
    }
};
