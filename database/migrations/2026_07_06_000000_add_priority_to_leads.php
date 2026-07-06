<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            // General lead priority for the Leads table (urgent | medium | low |
            // null = none). Distinct from immigration_priority (cases board).
            $table->string('priority', 20)->nullable()->after('stage');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('priority');
        });
    }
};
