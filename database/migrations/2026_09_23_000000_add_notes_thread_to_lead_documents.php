<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Threaded staff notes on a generated document (the Notes column on the
 * Proposal & Agreements → Agreements tab), mirroring the per-programme note
 * thread on the Proposals tab: each entry has author/time, a NOTE/CHANGE
 * REQUESTED tag, replies, and an "actioned" flag. Stored as JSON on the
 * document itself.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_documents', function (Blueprint $table) {
            $table->json('notes')->nullable()->after('note');
        });
    }

    public function down(): void
    {
        Schema::table('lead_documents', function (Blueprint $table) {
            $table->dropColumn('notes');
        });
    }
};
