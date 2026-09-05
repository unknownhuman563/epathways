<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-room columns were NOT NULL back when per_room was the only supported
 * rental mode. With whole_property mode they're now legitimately empty, so
 * the DB has to accept null. Requires doctrine/dbal for `->change()` on
 * older Laravel, and needs both `->nullable()` and `->change()` to alter.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accommodation_properties', function (Blueprint $table) {
            $table->string('room_type')->nullable()->change();
            $table->string('bed_type')->nullable()->change();
            $table->string('bathroom_type')->nullable()->change();
            $table->decimal('rent_single', 10, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        // Backfill any nulls to safe defaults before restoring NOT NULL so
        // rows that were saved in whole_property mode don't block the change.
        Schema::table('accommodation_properties', function (Blueprint $table) {
            \DB::table('accommodation_properties')->whereNull('room_type')->update(['room_type' => 'single']);
            \DB::table('accommodation_properties')->whereNull('bed_type')->update(['bed_type' => 'single']);
            \DB::table('accommodation_properties')->whereNull('bathroom_type')->update(['bathroom_type' => 'shared']);
            \DB::table('accommodation_properties')->whereNull('rent_single')->update(['rent_single' => 0]);
            $table->string('room_type')->nullable(false)->change();
            $table->string('bed_type')->nullable(false)->change();
            $table->string('bathroom_type')->nullable(false)->change();
            $table->decimal('rent_single', 10, 2)->nullable(false)->change();
        });
    }
};
