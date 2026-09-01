<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            // Per-program "why this program" reasons, keyed by program id.
            // Mirrors proposed_program_ids; shown to the client on the tracker.
            if (! Schema::hasColumn('leads', 'proposed_program_reasons')) {
                $table->json('proposed_program_reasons')->nullable()->after('proposed_program_ids');
            }
        });

        Schema::table('lead_proposals', function (Blueprint $table) {
            // Snapshot of the reasons for this proposal version.
            if (! Schema::hasColumn('lead_proposals', 'reasons')) {
                $table->json('reasons')->nullable()->after('program_ids');
            }
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('proposed_program_reasons');
        });
        Schema::table('lead_proposals', function (Blueprint $table) {
            $table->dropColumn('reasons');
        });
    }
};
