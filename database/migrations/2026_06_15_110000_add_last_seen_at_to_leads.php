<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            if (! Schema::hasColumn('leads', 'last_seen_at')) {
                // Last time the lead opened their /track/{code} page.
                $table->timestamp('last_seen_at')->nullable()->after('tracking_code');
            }
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            if (Schema::hasColumn('leads', 'last_seen_at')) {
                $table->dropColumn('last_seen_at');
            }
        });
    }
};
