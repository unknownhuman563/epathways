<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Build 12 fast-follow — when the IAA licence was last verified against the
 * public register (the actual source of truth). The number + expiry stored on
 * the user are only as trustworthy as the last manual check; recording that
 * check makes an annual re-verification auditable, and is set admin-side only.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->date('iaa_licence_verified_at')->nullable()->after('iaa_licence_expiry');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('iaa_licence_verified_at');
        });
    }
};
