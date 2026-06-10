<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Education-portal-specific stage column. The lead-wide `stage` column on
 * `leads` tracks the global sales pipeline; this is a separate downstream
 * lifecycle the Education team owns once a lead becomes a student
 * (Endorsed to School → Conditional Offer → … → Started Course).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('education_stage', 50)->nullable()->after('stage');
            $table->index('education_stage');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropIndex(['education_stage']);
            $table->dropColumn('education_stage');
        });
    }
};
