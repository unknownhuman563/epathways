<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            // Study-proposal verification workflow. Single JSON column (BLOB —
            // exempt from InnoDB's in-row limit, unlike a VARCHAR on this wide
            // table). Shape: { status: pending|verified|approved, submitted_at,
            // submitted_by, verified_at, verified_by, approved_at, approved_by }.
            // Null = no pending proposal (legacy proposals stay live).
            if (! Schema::hasColumn('leads', 'proposal_review')) {
                $table->json('proposal_review')->nullable()->after('proposed_program_reasons');
            }
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('proposal_review');
        });
    }
};
