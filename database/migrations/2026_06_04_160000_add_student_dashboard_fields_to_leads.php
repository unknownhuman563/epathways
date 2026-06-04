<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Mirrors the columns the Education team tracks in their "Students Dashboard"
// spreadsheet (Date Engaged, Payment, Intake, Program, School, COOP, PTE/IELTS,
// OOP, GDrive, Comments). The lead row already covers identity / contact /
// status / engagement date / program / intake / english test, so this migration
// only adds the genuinely-missing columns and keeps everything on `leads` so the
// expanded student row stays a single query.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('student_payment')->nullable()->after('agreements_acknowledged_at');
            $table->string('student_school')->nullable()->after('student_payment');
            $table->string('student_coop')->nullable()->after('student_school');
            $table->string('student_oop')->nullable()->after('student_coop');
            $table->string('student_gdrive_link', 512)->nullable()->after('student_oop');
            $table->text('student_comments')->nullable()->after('student_gdrive_link');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn([
                'student_payment',
                'student_school',
                'student_coop',
                'student_oop',
                'student_gdrive_link',
                'student_comments',
            ]);
        });
    }
};
