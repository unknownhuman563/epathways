<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Track which program the client had selected on each proposal version. When a
 * new proposal is created the current selection is stamped onto the version
 * being superseded (so history keeps "what they'd picked"), and the new active
 * proposal starts with nothing selected. The lead's live preferred_program_id
 * still holds the ACTIVE version's selection.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_proposals', function (Blueprint $table) {
            $table->foreignId('selected_program_id')->nullable()->after('program_ids')
                ->constrained('programs')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('lead_proposals', function (Blueprint $table) {
            $table->dropConstrainedForeignId('selected_program_id');
        });
    }
};
