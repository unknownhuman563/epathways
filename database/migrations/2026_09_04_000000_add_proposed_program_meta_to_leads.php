<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-program verification overrides for the Program Verification module —
 * keyed by program id: { "<id>": { fee, school, intake, status, edited } }.
 * JSON (not VARCHAR) to stay clear of the leads-table in-row size limit.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->json('proposed_program_meta')->nullable()->after('proposed_program_reasons');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('proposed_program_meta');
        });
    }
};
