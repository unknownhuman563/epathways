<?php

use App\Models\Lead;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Add `stage_updated_at` + `stage_updated_by` columns to leads so the
 * Students / Cases tables can render a stable "Updated [date] · Endorsed
 * by [Name]" subtitle below each stage chip.
 *
 * The lead's generic `updated_at` ticks on every save (notes, internal
 * fields, anything), so it's a poor signal for "when did the pipeline
 * stage actually change?". These dedicated columns are only touched by
 * the stage-update endpoints + creation flows, so the subtitle reflects
 * actual stage movement instead of incidental field edits.
 *
 * Backfill: seed the new columns from the existing immigration /
 * student_converted_at + _by fields so historical rows have a value.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->timestamp('stage_updated_at')->nullable()->after('updated_at');
            $table->foreignId('stage_updated_by')->nullable()->after('stage_updated_at')
                ->constrained('users')->nullOnDelete();
        });

        // Backfill — pick whichever conversion timestamp is the most
        // recent, since either could mark the last meaningful stage hop.
        DB::table('leads')->orderBy('id')->chunkById(500, function ($rows) {
            foreach ($rows as $l) {
                $candidates = collect([
                    'imm' => [$l->immigration_converted_at, $l->immigration_converted_by],
                    'stu' => [$l->student_converted_at,     $l->student_converted_by],
                    'acc' => [$l->accommodation_converted_at, $l->accommodation_converted_by],
                    'eng' => [$l->english_converted_at,     $l->english_converted_by],
                ])->filter(fn ($pair) => ! empty($pair[0]));

                if ($candidates->isEmpty()) {
                    continue;
                }

                $latest = $candidates->sortByDesc(fn ($pair) => $pair[0])->first();
                DB::table('leads')->where('id', $l->id)->update([
                    'stage_updated_at' => $latest[0],
                    'stage_updated_by' => $latest[1],
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropForeign(['stage_updated_by']);
            $table->dropColumn(['stage_updated_at', 'stage_updated_by']);
        });
    }
};
