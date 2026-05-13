<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Snapshot of the actor's role at the time of the action (admin | sales |
     * education | english | immigration | accommodation). Kept alongside
     * actor_name so the audit row stays meaningful after a user is deleted.
     */
    public function up(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->string('actor_role')->nullable()->after('actor_name');
        });
    }

    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropColumn('actor_role');
        });
    }
};
