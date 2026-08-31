<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A handful of "how do I actually reach this person" facts the sub-agent portal
 * collects and nothing else on `leads` records: the best time to call, the
 * channel they answer on, the languages they speak, an emergency contact, and
 * what they say they want out of this.
 *
 * They land in ONE json column rather than five string columns on purpose. The
 * `leads` table is the 200+ column god table sitting at InnoDB's ~8126-byte
 * in-row limit (see CLAUDE.md and docs/refactors/leads-table-split.md), so every
 * new VARCHAR is a production-only failure waiting to happen. JSON is a
 * BLOB-family type and is exempt from that limit, so this is one safe column
 * instead of five risky ones — and it is a single thing to lift out when the
 * table is finally split.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('leads', 'contact_profile')) {
            return;
        }

        // json() maps to a BLOB-family type on MySQL (exempt from the in-row
        // limit) and to TEXT on sqlite, so no ROW_FORMAT juggling is needed
        // here the way it is for a VARCHAR — see the nzer_number migration.
        Schema::table('leads', fn (Blueprint $t) => $t->json('contact_profile')->nullable());
    }

    public function down(): void
    {
        if (! Schema::hasColumn('leads', 'contact_profile')) {
            return;
        }

        // Dropping a column on sqlite rebuilds the table; harmless either way.
        Schema::table('leads', fn (Blueprint $t) => $t->dropColumn('contact_profile'));
    }
};
