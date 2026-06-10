<?php

use App\Models\Lead;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // tracking_code is what we hand to the lead so they can poll
        // /track for their pipeline status without an account. It is
        // deliberately separate from `lead_id` (which leaks the source
        // flow — FA-, EE-, LP- — and is used in admin tooling). 11
        // chars, prefix + 8 unambiguous alphanumerics, unique and
        // indexed so collisions cannot happen even at scale.
        Schema::table('leads', function (Blueprint $table) {
            $table->string('tracking_code', 16)->nullable()->after('lead_id');
            $table->unique('tracking_code');
        });

        // Backfill every existing lead so legacy rows are also trackable.
        // The generator handles collision avoidance against rows already
        // assigned in earlier loop iterations.
        Lead::whereNull('tracking_code')->each(function (Lead $lead) {
            $lead->tracking_code = Lead::generateTrackingCode();
            $lead->saveQuietly();
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropUnique(['tracking_code']);
            $table->dropColumn('tracking_code');
        });
    }
};
