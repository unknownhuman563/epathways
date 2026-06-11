<?php

use App\Models\Lead;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Companion to the earlier handoff-flag backfill: every lead whose
 * education_stage sits in EDUCATION_STAGES_IMMIGRATION had `is_student`
 * left set to true alongside the new `is_immigration_case`, so the lead
 * detail's Move-To widget showed BOTH Study and Case as ACTIVE.
 *
 * Going forward EducationController::updateStudentField() retires
 * `is_student` the moment the stage moves into the handoff range — this
 * migration applies the same retirement to historical rows. Idempotent:
 * skips rows already off.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('leads')
            ->whereIn('education_stage', Lead::EDUCATION_STAGES_IMMIGRATION)
            ->where('is_student', true)
            ->update(['is_student' => false]);
    }

    public function down(): void
    {
        // No automatic rollback — we can't distinguish "retired by this
        // backfill" from "explicitly toggled off later". Leaving the flag
        // off is the safe default.
    }
};
