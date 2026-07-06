<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Links a lead to the recruiting Agent (a user with role='agent') who added
 * it. Set on creation for agent-created leads; null for everything else.
 * Drives the Agent portal's own-leads scope and the Sales "Agents" tab.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            if (! Schema::hasColumn('leads', 'agent_id')) {
                $table->foreignId('agent_id')->nullable()->after('assigned_to')
                    ->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            if (Schema::hasColumn('leads', 'agent_id')) {
                $table->dropForeign(['agent_id']);
                $table->dropColumn('agent_id');
            }
        });
    }
};
