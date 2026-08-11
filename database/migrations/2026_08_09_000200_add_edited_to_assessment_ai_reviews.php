<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Let the adviser refine the AI-drafted note and client email in place. The AI
 * output stays in `raw` for provenance; adviser_note / client_email hold the
 * current (possibly adviser-edited) version, stamped with who edited and when
 * so the human remains the author of record (guardrail §2).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assessment_ai_reviews', function (Blueprint $table) {
            $table->foreignId('edited_by')->nullable()->after('reviewed_by')->constrained('users')->nullOnDelete();
            $table->timestamp('edited_at')->nullable()->after('edited_by');
        });
    }

    public function down(): void
    {
        Schema::table('assessment_ai_reviews', function (Blueprint $table) {
            $table->dropConstrainedForeignId('edited_by');
            $table->dropColumn('edited_at');
        });
    }
};
