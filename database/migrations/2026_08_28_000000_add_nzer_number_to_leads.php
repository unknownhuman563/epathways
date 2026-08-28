<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * NZER number — another INZ-side identifier staff record on a case and search by.
 *
 * The `leads` table has grown wide enough that adding another VARCHAR hits
 * InnoDB's ~8126-byte in-row limit ("Row size too large", SQLSTATE 1118). The
 * fix is to switch the table to ROW_FORMAT=DYNAMIC, which stores long varchars
 * off-page (only a 20-byte pointer counts toward the in-row size), freeing room
 * for this and future columns. Done first, then the column is added.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE `leads` ROW_FORMAT=DYNAMIC');
        }

        Schema::table('leads', function (Blueprint $table) {
            $table->string('nzer_number', 60)->nullable()->after('inz_medical_ref');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('nzer_number');
        });
    }
};
