<?php

use App\Models\Lead;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Backfill `is_immigration_case = true` for students who have already been
 * moved onto an Education → Immigration handoff stage. Going forward,
 * EducationController::updateStudentField() flips the flag the moment the
 * Education team picks one of those stages — but historical rows were
 * created before that auto-promote existed, so the lead-detail "Move To"
 * widget still doesn't show Immigration as ACTIVE on them.
 *
 * Idempotent: only touches rows where the flag isn't already set.
 */
return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        DB::table('leads')
            ->whereIn('education_stage', Lead::EDUCATION_STAGES_IMMIGRATION)
            ->where(function ($q) {
                $q->where('is_immigration_case', false)->orWhereNull('is_immigration_case');
            })
            ->update([
                'is_immigration_case'      => true,
                'immigration_converted_at' => $now,
                // Migration is system-driven, no user attribution.
                'immigration_converted_by' => null,
            ]);
    }

    public function down(): void
    {
        // No automatic rollback — we can't tell which rows were flipped by
        // the backfill vs. which were genuine manual conversions. Leaving
        // the flag in place is the safe default.
    }
};
