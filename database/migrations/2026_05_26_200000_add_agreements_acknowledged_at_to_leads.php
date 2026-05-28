<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            // When the lead ticks the "I have read and agreed to the
            // Consultancy and English Engagement Agreement terms" checkbox
            // in their portal. One timestamp covers both agreements since
            // the acknowledgment is unified.
            $table->timestamp('agreements_acknowledged_at')->nullable()->after('document_checklist');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('agreements_acknowledged_at');
        });
    }
};
