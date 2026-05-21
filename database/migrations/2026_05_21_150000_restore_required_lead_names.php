<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Restore NOT NULL on lead names. Backfills any NULLs to '' first so the
 * column-type change doesn't fail on existing data. The importer now
 * substitutes '' for missing names rather than relying on nullability.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('leads')->whereNull('first_name')->update(['first_name' => '']);
        DB::table('leads')->whereNull('last_name')->update(['last_name' => '']);

        Schema::table('leads', function (Blueprint $table) {
            $table->string('first_name')->nullable(false)->change();
            $table->string('last_name')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('first_name')->nullable()->change();
            $table->string('last_name')->nullable()->change();
        });
    }
};
