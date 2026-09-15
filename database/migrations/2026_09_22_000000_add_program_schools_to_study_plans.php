<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-program school for education students: an array of school names aligned
 * index-for-index with the delimited `preferred_course` programs, so each
 * program can show its own school (most catalogue programs have no school set,
 * so this captures what staff pick per program). student_school on the lead
 * keeps the de-duplicated union for the list view + legacy reads.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_study_plans', function (Blueprint $table) {
            $table->json('program_schools')->nullable()->after('preferred_course');
        });
    }

    public function down(): void
    {
        Schema::table('lead_study_plans', function (Blueprint $table) {
            $table->dropColumn('program_schools');
        });
    }
};
