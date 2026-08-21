<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Rename the pipeline stage "Booking Confirmation with Bryll" to just
 * "Booking Confirmation" on existing leads (the code constant/references were
 * renamed too). Idempotent; reversible.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('leads')->where('status', 'Booking Confirmation with Bryll')
            ->update(['status' => 'Booking Confirmation']);
    }

    public function down(): void
    {
        DB::table('leads')->where('status', 'Booking Confirmation')
            ->update(['status' => 'Booking Confirmation with Bryll']);
    }
};
