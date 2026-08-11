<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Build 12 phase 3 refinement — scope a dismissal to the situation it dismissed.
 *
 * A permanent dismissal is right for a false positive but wrong when the
 * underlying situation changes (a rejected doc replaced by a different rejected
 * doc; a passport with a new expiry). We store a fingerprint of the finding's
 * stable evidence at dismissal time; if a later evaluation sees a different
 * fingerprint, the finding re-opens. Same fingerprint → the dismissal holds.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('case_findings', function (Blueprint $table) {
            $table->string('dismissed_fingerprint', 64)->nullable()->after('dismiss_reason');
        });
    }

    public function down(): void
    {
        Schema::table('case_findings', function (Blueprint $table) {
            $table->dropColumn('dismissed_fingerprint');
        });
    }
};
