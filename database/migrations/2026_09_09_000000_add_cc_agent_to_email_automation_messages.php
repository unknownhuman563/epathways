<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// When set, a message also CCs the lead's own recruiting agent (leads.agent_id)
// so the agent is kept in the loop on updates for their clients — resolved
// per-lead at send time, not a static address on the template.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('email_automation_messages', function (Blueprint $table) {
            $table->boolean('cc_agent')->default(false)->after('enabled');
        });
    }

    public function down(): void
    {
        Schema::table('email_automation_messages', function (Blueprint $table) {
            $table->dropColumn('cc_agent');
        });
    }
};
