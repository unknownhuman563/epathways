<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Build 12 phase 2 — case custody. One owner at a time, changed only through an
 * explicit handoff that carries a note (no silent reassignment, no multi-owner).
 *
 * No backfill: legacy cases start with a null owner, which is a valid state —
 * "Unassigned" is a first-class filter on the Cases board and is where genuinely
 * dropped cases surface. Inventing an owner for them would bury exactly that.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            // constrained() also creates the index the My-queue / Unassigned
            // filters query on, so no separate ->index() is needed.
            $table->foreignId('current_owner_id')
                ->nullable()
                ->after('immigration_assignee')
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('owner_since')->nullable()->after('current_owner_id');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropConstrainedForeignId('current_owner_id');
            $table->dropColumn('owner_since');
        });
    }
};
