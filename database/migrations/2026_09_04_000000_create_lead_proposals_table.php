<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Proposal version history. Previously a lead had a single overwritable
 * `proposed_program_ids` shortlist — creating a new proposal lost the old
 * one. Each save now also snapshots here so every past proposal (and the
 * programs it suggested) is kept and auditable. `leads.proposed_program_ids`
 * still holds the ACTIVE (latest) shortlist that the tracker/client reads.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            // Snapshot of the suggested program ids at save time.
            $table->json('program_ids');
            // Who saved this version (null for system/seed).
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['lead_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_proposals');
    }
};
