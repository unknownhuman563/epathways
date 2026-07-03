<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-case priority for immigration cases: urgent | medium | low (nullable).
 * Drives the coloured case avatar on the Cases table (red / orange / green).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('immigration_priority', 20)->nullable()->after('immigration_stage');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('immigration_priority');
        });
    }
};
