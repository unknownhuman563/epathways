<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lead's pick from the staff-suggested proposal shortlist. NULL until
 * the lead visits their tracker and taps "Choose this one". Uses
 * nullOnDelete so removing the underlying program doesn't cascade-
 * delete the lead — it just clears their pick.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->foreignId('preferred_program_id')
                ->nullable()
                ->after('proposed_program_ids')
                ->constrained('programs')
                ->nullOnDelete();
            $table->timestamp('preferred_program_chosen_at')
                ->nullable()
                ->after('preferred_program_id');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropConstrainedForeignId('preferred_program_id');
            $table->dropColumn('preferred_program_chosen_at');
        });
    }
};
