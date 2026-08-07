<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Bearer token for the client-facing reschedule / cancel links in
            // booking emails — the token identifies the booking so the flow can
            // skip the intake form for a known client.
            $table->string('manage_token', 64)->nullable()->unique()->after('lead_id');
        });

        // Backfill existing bookings so their links work too.
        DB::table('bookings')->whereNull('manage_token')->orderBy('id')->pluck('id')
            ->each(fn ($id) => DB::table('bookings')->where('id', $id)->update(['manage_token' => Str::random(48)]));
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropUnique('bookings_manage_token_unique');
            $table->dropColumn('manage_token');
        });
    }
};
