<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            // Tags the entry-point that captured the lead (hero, quick-form,
            // exit-intent, fee-guide, newsletter, etc.). Null for legacy
            // free-assessment rows so sales can still distinguish them by
            // lead_id prefix.
            $table->string('source', 60)->nullable()->after('ai_analysis_status');
            $table->index('source');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropIndex(['source']);
            $table->dropColumn('source');
        });
    }
};
