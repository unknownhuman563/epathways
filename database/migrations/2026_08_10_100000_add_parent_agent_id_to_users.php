<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A sub-agent (role='sub_agent') works the referral leads of ONE recruiting
 * agent. `parent_agent_id` links the sub-agent to that agent; their whole lead
 * pool is scoped to leads where agent_id = parent_agent_id.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('parent_agent_id')->nullable()->after('referral_code');
            $table->index('parent_agent_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['parent_agent_id']);
            $table->dropColumn('parent_agent_id');
        });
    }
};
