<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adviser licence type (Full / Provisional / Limited) — shown on the
 * profile and available to stamp on generated agreements alongside the
 * licence number.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('iaa_licence_type')->nullable()->after('iaa_licence_number');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('iaa_licence_type');
        });
    }
};
