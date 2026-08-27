<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * INZ issues each client two identification numbers — a persistent Client
 * number and a per-application Application number — plus a Medical reference
 * for the health case. These replace the single free-text "NZ immigration ID"
 * and power the immigration portal search.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('inz_client_number', 60)->nullable()->after('inz_reference');
            $table->string('inz_application_number', 60)->nullable()->after('inz_client_number');
            $table->string('inz_medical_ref', 60)->nullable()->after('inz_application_number');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['inz_client_number', 'inz_application_number', 'inz_medical_ref']);
        });
    }
};
