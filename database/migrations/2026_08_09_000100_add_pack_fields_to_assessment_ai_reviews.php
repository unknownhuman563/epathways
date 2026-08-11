<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Extend the AI assessment review into a full internal "adviser pack": alongside
 * the completeness observations, one run now also produces risks-to-investigate,
 * a tailored document checklist, a draft adviser note, and a draft client email.
 * All internal/indicative/draft — never eligibility advice, never auto-sent.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assessment_ai_reviews', function (Blueprint $table) {
            $table->json('risks')->nullable()->after('observations');          // [{severity, area, note}]
            $table->json('checklist')->nullable()->after('risks');             // [{document, required, note}]
            $table->longText('adviser_note')->nullable()->after('summary');    // draft note the adviser edits
            $table->json('client_email')->nullable()->after('adviser_note');   // {subject, body} — draft, adviser sends
        });
    }

    public function down(): void
    {
        Schema::table('assessment_ai_reviews', function (Blueprint $table) {
            $table->dropColumn(['risks', 'checklist', 'adviser_note', 'client_email']);
        });
    }
};
