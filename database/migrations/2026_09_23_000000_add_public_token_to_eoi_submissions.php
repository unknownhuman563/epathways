<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A per-submission public token so the tenant can open their Pre-Tenancy form
 * from an emailed link without logging in (bearer credential, like the
 * lead-tracking code). Replaces the external Google Form.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accommodation_eoi_submissions', function (Blueprint $table) {
            $table->string('public_token', 64)->nullable()->unique()->after('id');
        });
    }

    public function down(): void
    {
        Schema::table('accommodation_eoi_submissions', function (Blueprint $table) {
            $table->dropColumn('public_token');
        });
    }
};
