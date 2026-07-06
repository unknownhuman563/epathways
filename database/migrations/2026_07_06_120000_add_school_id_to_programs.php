<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Programs now link to a School row (institution catalogue) instead of
 * relying solely on the free-text `institution` column. The FK is
 * nullable and set-null on delete so removing a school leaves its
 * programs intact but unlinked — the legacy `institution` text stays
 * around as a fallback display for rows created before this migration.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            $table->foreignId('school_id')
                ->nullable()
                ->after('institution')
                ->constrained('schools')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('school_id');
        });
    }
};
