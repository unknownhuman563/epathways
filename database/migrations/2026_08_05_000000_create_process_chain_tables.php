<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Build 12 phase 4.5 — process chain. The department's 16-step process becomes
 * first-class per-case structure. See docs/immigration/build-12-case-collaboration.md §15.
 *
 *   case_step_templates       the 16-step definition (seeded); owner_role, stage
 *                             mapping, SLA, gate, depends_on DAG, applies_when.
 *   case_step_states          one row per (lead, step, ATTEMPT), append-only —
 *                             re-entry (RFI, rejected doc, needs_something) opens
 *                             a new attempt rather than mutating the old one.
 *   case_payments             minimum payment state so step 11 is a real gate
 *                             (and the phase-3 invoice-overdue rule can graduate).
 *   case_partner_recommendation  the partner-visa fork before step 06.
 *
 * QC stamps write to case_step_states.qc_result only — NOT licence-gated. The
 * advice-bearing verdict + lodgement sign-off (case_attestations) are Phase 5.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('case_step_templates', function (Blueprint $table) {
            $table->id();
            $table->string('step_key', 20)->unique();      // '01'..'16', '06a'
            $table->unsignedSmallInteger('position');       // display / activation order
            $table->string('label', 160);
            $table->string('owner_role', 40);               // process function, not a person
            $table->string('stage', 80)->nullable();        // maps to Lead::IMMIGRATION_STAGES
            $table->json('sla')->nullable();                // {type: duration|milestone|recurring, ...}
            $table->boolean('gate')->default(false);
            $table->boolean('is_qc')->default(false);
            $table->boolean('channels_required')->default(false); // the 3-channel steps
            $table->json('depends_on')->nullable();         // array of step_keys (DAG)
            $table->json('applies_when')->nullable();       // predicate, or null = always
            $table->timestamps();
        });

        Schema::create('case_step_states', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->string('step_key', 20);
            $table->unsignedSmallInteger('attempt')->default(1);
            $table->enum('status', ['pending', 'active', 'done', 'blocked', 'not_applicable'])->default('pending');
            $table->foreignId('owner_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('due_at')->nullable();        // SLA due for THIS attempt (UTC, business-clock)
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable();
            $table->enum('qc_result', ['pass', 'fail'])->nullable();   // QC steps only; NOT advice
            $table->json('channels')->nullable();           // {message:{...}, call:{...}, email:{...}}
            $table->enum('reactivation_trigger', ['rfi', 'doc_rejected', 'verdict_needs_something', 'manual'])->nullable();
            $table->text('reactivation_reason')->nullable();
            $table->unsignedSmallInteger('reactivated_from_attempt')->nullable();
            $table->timestamps();

            $table->unique(['lead_id', 'step_key', 'attempt']);
            $table->index(['lead_id', 'status']);
        });

        Schema::create('case_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignId('invoice_document_id')->nullable()->constrained('lead_documents')->nullOnDelete();
            $table->decimal('amount_expected', 10, 2)->default(0);
            $table->decimal('amount_received', 10, 2)->default(0);
            $table->enum('status', ['unpaid', 'part_paid', 'paid'])->default('unpaid'); // derived on write
            $table->string('method', 40)->nullable();
            $table->timestamp('received_at')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('lead_id');
        });

        Schema::create('case_partner_recommendation', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            // The recommendation is ADVICE — adviser-authored, licence-gated at
            // the write path (see controller); the column just stores it.
            $table->string('recommended_main_applicant', 160)->nullable();
            $table->text('recommendation_reason')->nullable();
            $table->string('client_choice', 160)->nullable();
            // The client's written confirmation — the evidence, not the checkbox.
            $table->foreignId('choice_document_id')->nullable()->constrained('lead_documents')->nullOnDelete();
            $table->timestamp('decided_at')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('lead_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('case_partner_recommendation');
        Schema::dropIfExists('case_payments');
        Schema::dropIfExists('case_step_states');
        Schema::dropIfExists('case_step_templates');
    }
};
