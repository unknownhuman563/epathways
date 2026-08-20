<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Rename the education booking consultant from "Fhilip Bryll Añabeza" to
 * "Emma Ceballo" on existing booking records (the public booking page source
 * was updated too). Idempotent; reversible.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('bookings')->where('consultant_name', 'Fhilip Bryll Añabeza')
            ->update(['consultant_name' => 'Emma Ceballo']);
    }

    public function down(): void
    {
        DB::table('bookings')->where('consultant_name', 'Emma Ceballo')
            ->update(['consultant_name' => 'Fhilip Bryll Añabeza']);
    }
};
