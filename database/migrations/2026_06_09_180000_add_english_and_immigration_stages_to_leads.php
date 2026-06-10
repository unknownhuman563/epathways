<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Department-specific lifecycle columns to match `education_stage`. Each
 * department owns its own sub-stage track:
 *   • english_stage      — PTE Review → DIY Review → For Mocktest → For Exam
 *   • immigration_stage  — Endorsed → Visa Lodged → RFI → AIP → Approved / Decline
 *
 * Setting `english_stage` routes the lead to the English tab; setting
 * `immigration_stage` (or `is_immigration_case`) routes it to Immigration.
 * See Lead::ENGLISH_STAGES / Lead::IMMIGRATION_STAGES for the canonical
 * value lists.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('english_stage', 50)->nullable()->after('education_stage');
            $table->string('immigration_stage', 50)->nullable()->after('english_stage');
            $table->index('english_stage');
            $table->index('immigration_stage');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropIndex(['english_stage']);
            $table->dropIndex(['immigration_stage']);
            $table->dropColumn(['english_stage', 'immigration_stage']);
        });
    }
};
