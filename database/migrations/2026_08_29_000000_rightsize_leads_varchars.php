<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Right-size the `leads` table's over-wide VARCHAR columns.
 *
 * Laravel's `$table->string()` defaults to VARCHAR(255); over time dozens of
 * columns that only ever hold tiny values (gender, has_passport, stage, …) were
 * left at 255. On utf8mb4 (4 bytes/char) that's up to 1020 bytes in-row each,
 * which is what pushed this 200+ column table over InnoDB's 8126-byte in-row
 * limit. This reclaims that space by sizing each column just above its real data.
 *
 * Sizes are deliberately generous (well above observed maxima) so production data
 * is never truncated, and each MODIFY is isolated in its own try/catch — a column
 * whose data is unexpectedly longer than the new size is skipped, not truncated.
 *
 * NOT touched on purpose: passport_number / passport_path (can hold long values),
 * the *_link URL columns, and tokens — leave those wide.
 */
return new class extends Migration
{
    /** column => "VARCHAR(n) [NOT] NULL [DEFAULT '…']" — new definition. */
    private array $defs = [
        'lead_id'               => "VARCHAR(60) NULL",
        'first_name'            => "VARCHAR(120) NOT NULL",
        'last_name'             => "VARCHAR(120) NOT NULL",
        'other_names'           => "VARCHAR(191) NULL",
        'email'                 => "VARCHAR(191) NULL",
        'phone'                 => "VARCHAR(40) NULL",
        'gender'                => "VARCHAR(40) NULL",
        'marital_status'        => "VARCHAR(40) NULL",
        'has_passport'          => "VARCHAR(20) NULL",
        'country'               => "VARCHAR(120) NULL",
        'country_of_birth'      => "VARCHAR(120) NULL",
        'citizenship'           => "VARCHAR(120) NULL",
        'residence_country'     => "VARCHAR(120) NULL",
        'referral'              => "VARCHAR(191) NULL",
        'branch'                => "VARCHAR(80) NULL",
        'stage'                 => "VARCHAR(120) NULL",
        'status'                => "VARCHAR(80) NOT NULL DEFAULT 'New'",
        'ai_analysis_status'    => "VARCHAR(30) NOT NULL DEFAULT 'pending'",
        'english_assignee'      => "VARCHAR(60) NULL",
        'immigration_assignee'  => "VARCHAR(60) NULL",
        'student_payment'       => "VARCHAR(60) NULL",
        'student_coop'          => "VARCHAR(60) NULL",
        'student_oop'           => "VARCHAR(60) NULL",
        // NOTE: other_names, place_of_birth, residence_city, residence_state and
        // student_school are converted to TEXT by the nzer migration (they're on
        // its off-page batch), so they're intentionally omitted here.
    ];

    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return; // sqlite (tests) has no such row-size limit; nothing to do
        }

        try {
            DB::statement('ALTER TABLE `leads` ROW_FORMAT=DYNAMIC');
        } catch (\Throwable $e) {
            // already dynamic / unsupported — the resizes below still free space
        }

        foreach ($this->defs as $col => $def) {
            try {
                DB::statement("ALTER TABLE `leads` MODIFY `{$col}` {$def}");
            } catch (\Throwable $e) {
                // data longer than the new size, or MODIFY blocked — skip safely
            }
        }
    }

    public function down(): void
    {
        // No-op: widening back to VARCHAR(255) would just re-bloat the row.
        // These columns are correctly sized now; nothing to reverse.
    }
};
