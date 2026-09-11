<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The education pipeline moved to the 15-stage management-report workflow.
 * Remap the handful of old education_stage values to their new labels so
 * existing students keep a valid position; unmatched visa sub-stages fold into
 * "Visa Lodged".
 */
return new class extends Migration
{
    private array $map = [
        'Endorsed to School' => 'School Enrolment',
        'Approved in Principle' => 'Visa Lodged',
        'Request for Information' => 'Visa Lodged',
    ];

    public function up(): void
    {
        foreach ($this->map as $old => $new) {
            DB::table('leads')->where('education_stage', $old)->update(['education_stage' => $new]);
        }
    }

    public function down(): void
    {
        // Best-effort reverse (School Enrolment -> Endorsed to School only; the
        // two visa sub-stages can't be distinguished after folding).
        DB::table('leads')->where('education_stage', 'School Enrolment')->update(['education_stage' => 'Endorsed to School']);
    }
};
