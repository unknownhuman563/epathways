<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_tasks', function (Blueprint $table) {
            // Multi-lead support. `lead_id` stays the primary so existing
            // relations / activity log entries keep working unchanged;
            // this column holds the co-linked lead ids as a JSON array.
            $table->json('additional_lead_ids')->nullable()->after('lead_id');
        });
    }

    public function down(): void
    {
        Schema::table('lead_tasks', function (Blueprint $table) {
            $table->dropColumn('additional_lead_ids');
        });
    }
};
